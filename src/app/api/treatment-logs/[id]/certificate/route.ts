import fs from "fs";
import path from "path";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import React from "react";
import { createClient } from "@/lib/supabase/server";
import { registerFonts } from "@/lib/pdf/invoice-template";
import { MedicalCertPDF } from "@/lib/pdf/medical-cert-template";
import type { TreatmentLog, Patient, ClinicSettings } from "@/types/supabase";

function fontDataUrl(filename: string): string {
  const abs = path.resolve(process.cwd(), "public", "fonts", filename);
  return `data:font/woff;base64,${fs.readFileSync(abs).toString("base64")}`;
}

let fontsRegistered = false;
function ensureFonts() {
  if (fontsRegistered) return;
  registerFonts(
    fontDataUrl("inter-400.woff"),
    fontDataUrl("inter-600.woff"),
    fontDataUrl("sarabun-400.woff"),
    fontDataUrl("sarabun-600.woff"),
  );
  fontsRegistered = true;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: log }, { data: settings }] = await Promise.all([
    supabase
      .from("treatment_logs")
      .select("*, patients(*), invoices(invoice_number)")
      .eq("id", id)
      .single(),
    supabase.from("clinic_settings").select("*").single(),
  ]);

  if (!log) return new Response("Treatment log not found", { status: 404 });

  const patient = (log as unknown as { patients: Patient }).patients;
  const linkedInvoice = (log as unknown as { invoices: { invoice_number: string } | null }).invoices;
  const certRef = linkedInvoice?.invoice_number ?? log.visit_date.replace(/-/g, "");

  try {
    ensureFonts();

    const logoPath = path.resolve(process.cwd(), "public", "logo.png");
    const logoDataUrl = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;

    const element = React.createElement(MedicalCertPDF, {
      treatmentLog: log as TreatmentLog,
      patient,
      clinicSettings: settings as ClinicSettings,
      certRef,
      logoUrl: logoDataUrl,
    }) as unknown as ReactElement<DocumentProps>;

    const buffer = await renderToBuffer(element);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cert-${certRef}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[Certificate PDF] renderToBuffer failed:", err);
    return new Response(
      JSON.stringify({ error: "PDF generation failed", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
