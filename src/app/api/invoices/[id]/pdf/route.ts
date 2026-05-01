import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import React from "react";
import { createClient } from "@/lib/supabase/server";
import { InvoicePDF } from "@/lib/pdf/invoice-template";
import type { Invoice } from "@/types/supabase";

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

  const patient = (invoice as { patients: { full_name: string | null; phone: string | null } }).patients;

  const element = React.createElement(InvoicePDF, {
    invoice: invoice as Invoice,
    patientName: patient?.full_name ?? "Patient",
    patientPhone: patient?.phone ?? null,
  }) as unknown as ReactElement<DocumentProps>;

  const buffer = await renderToBuffer(element);
  const filename = `${invoice.invoice_number}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
