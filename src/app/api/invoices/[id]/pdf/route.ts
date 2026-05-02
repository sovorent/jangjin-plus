import fs from "fs";
import path from "path";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import React from "react";
import { createClient } from "@/lib/supabase/server";
import { InvoicePDF, registerFonts } from "@/lib/pdf/invoice-template";
import type { Invoice } from "@/types/supabase";

/** Read a file from public/fonts and return as a base64 data-URL string. */
function fontDataUrl(filename: string): string {
  const abs = path.resolve(process.cwd(), "public", "fonts", filename);
  const buf = fs.readFileSync(abs);
  return `data:font/woff;base64,${buf.toString("base64")}`;
}

// Preload font data-URLs once per process (cached in module scope).
// Using data-URLs ensures @react-pdf/renderer never does an HTTP fetch.
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

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, patients(id, full_name, phone)")
    .eq("id", id)
    .single();

  if (!invoice) {
    return new Response("Invoice not found", { status: 404 });
  }

  try {
    ensureFonts();

    const patient = (
      invoice as { patients: { full_name: string | null; phone: string | null } }
    ).patients;

    const logoPath = path.resolve(process.cwd(), "public", "logo.png");
    const logoDataUrl = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;

    const element = React.createElement(InvoicePDF, {
      invoice: invoice as Invoice,
      patientName: patient?.full_name ?? "Patient",
      patientPhone: patient?.phone ?? null,
      logoUrl: logoDataUrl,
    }) as unknown as ReactElement<DocumentProps>;

    const buffer = await renderToBuffer(element);
    const filename = `${invoice.invoice_number}.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[PDF] renderToBuffer failed:", err);
    return new Response(
      JSON.stringify({ error: "PDF generation failed", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
