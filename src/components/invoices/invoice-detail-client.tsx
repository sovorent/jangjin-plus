"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { format } from "date-fns";
import { Download, XCircle } from "lucide-react";
import type { Invoice, Patient } from "@/types/supabase";
import { VoidInvoiceDialog } from "./void-invoice-dialog";

interface Props {
  invoice: Invoice & { patients: Pick<Patient, "id" | "full_name" | "phone"> };
}

function StatusBadge({ status }: { status: string }) {
  if (status === "void") {
    return (
      <span
        className="inline-block px-2.5 py-0.5 rounded-full text-[12px] font-semibold font-thai"
        style={{ background: "var(--danger-light)", color: "var(--danger)" }}
      >
        โมฆะ
      </span>
    );
  }
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-[12px] font-semibold font-thai"
      style={{ background: "var(--success-light)", color: "var(--success)" }}
    >
      ชำระแล้ว
    </span>
  );
}

export function InvoiceDetailClient({ invoice }: Props) {
  const t = useTranslations("invoices");
  const [currentInvoice, setCurrentInvoice] = useState(invoice);
  const [voidOpen, setVoidOpen] = useState(false);

  const snapshot = currentInvoice.clinic_snapshot;
  const isVoided = currentInvoice.status === "void";

  // Graceful fallbacks when clinic settings are not yet configured
  const clinicNameEN = snapshot?.clinic_name_en ?? "JangJin TCM Clinic";
  const clinicNameTH = snapshot?.clinic_name_th ?? null;

  return (
    <div>
      {/* ── Page header / toolbar ─────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1
            className="font-serif text-[20px] font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {currentInvoice.invoice_number}
          </h1>
          <StatusBadge status={currentInvoice.status} />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(`/api/invoices/${currentInvoice.id}/pdf`, "_blank")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-thai transition-opacity hover:opacity-80"
            style={{ background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--border)" }}
          >
            <Download className="w-3.5 h-3.5" />
            {t("download_pdf")}
          </button>
          {!isVoided && (
            <button
              onClick={() => setVoidOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-thai transition-opacity hover:opacity-80"
              style={{ background: "var(--danger-light)", color: "var(--danger)", border: "1px solid var(--border)" }}
            >
              <XCircle className="w-3.5 h-3.5" />
              {t("void_invoice")}
            </button>
          )}
        </div>
      </div>

      {/* ── Invoice card ──────────────────────────────── */}
      <div
        className="rounded-xl relative overflow-hidden"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* Void watermark */}
        {isVoided && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ transform: "rotate(-25deg)" }}
          >
            <span
              className="font-serif text-[64px] font-bold tracking-widest select-none"
              style={{ color: "rgba(220,38,38,0.10)" }}
            >
              VOID / โมฆะ
            </span>
          </div>
        )}

        {/* Card body */}
        <div className="px-8 py-7">
          {/* ── Clinic + Invoice number ────────────── */}
          <div
            className="flex justify-between items-start pb-5 mb-5"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            {/* Left: clinic info */}
            <div>
              <div
                className="font-serif text-[15px] font-bold mb-0.5"
                style={{ color: "var(--foreground)" }}
              >
                {clinicNameEN}
              </div>
              {clinicNameTH && (
                <div className="font-thai text-[12px]" style={{ color: "var(--text-muted)" }}>
                  {clinicNameTH}
                </div>
              )}
              {snapshot?.clinic_address_en && (
                <div className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                  {snapshot.clinic_address_en}
                </div>
              )}
              {snapshot?.clinic_phone && (
                <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {snapshot.clinic_phone}
                </div>
              )}
              {snapshot?.clinic_tax_id && (
                <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Tax ID: {snapshot.clinic_tax_id}
                </div>
              )}
            </div>

            {/* Right: invoice meta */}
            <div className="text-right">
              <div
                className="text-[9px] uppercase tracking-widest mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Invoice
              </div>
              <div
                className="font-sans text-[20px] font-extrabold"
                style={{ color: "var(--primary)" }}
              >
                {currentInvoice.invoice_number}
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                {format(new Date(currentInvoice.issue_date), "dd/MM/yyyy")}
              </div>
            </div>
          </div>

          {/* ── Bill to ───────────────────────────── */}
          <div
            className="pb-5 mb-5"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div
              className="text-[10px] uppercase tracking-widest mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              Bill to
            </div>
            <Link
              href={`/patients/${currentInvoice.patient_id}`}
              className="font-thai text-[15px] font-semibold hover:underline"
              style={{ color: "var(--foreground)" }}
            >
              {currentInvoice.patients.full_name ?? "—"}
            </Link>
            {currentInvoice.patients.phone && (
              <div className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                {currentInvoice.patients.phone}
              </div>
            )}
          </div>

          {/* ── Line items table ──────────────────── */}
          <table className="w-full border-collapse mb-0">
            <thead>
              <tr style={{ background: "var(--background)" }}>
                {["Description", "Qty", "Unit price", "Total"].map((h) => (
                  <th
                    key={h}
                    className={`py-2 px-2.5 text-[10px] uppercase tracking-wide font-medium ${
                      h === "Description" ? "text-left" : "text-right"
                    }`}
                    style={{
                      color: "var(--text-muted)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentInvoice.line_items.map((item, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="py-3 px-2.5">
                    <div
                      className="font-thai text-[13px] font-semibold"
                      style={{ color: "var(--foreground)" }}
                    >
                      {item.description_en}
                    </div>
                    {item.description_th && (
                      <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {item.description_th}
                      </div>
                    )}
                  </td>
                  <td
                    className="py-3 px-2.5 text-right text-[13px]"
                    style={{ color: "var(--foreground)" }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    className="py-3 px-2.5 text-right font-sans text-[13px]"
                    style={{ color: "var(--foreground)" }}
                  >
                    ฿{item.unit_price_thb.toLocaleString("en", { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    className="py-3 px-2.5 text-right font-sans text-[13px] font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    ฿{item.total_thb.toLocaleString("en", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Total + payment ────────────────────── */}
          <div
            className="pt-4 mt-0 flex justify-between items-end"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div className="text-[13px] font-thai" style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--text-muted)" }}>ชำระโดย / Payment: </span>
              <span className="font-semibold">
                {currentInvoice.payment_method === "cash" ? "เงินสด / Cash" : "QR PromptPay"}
              </span>
            </div>
            <div className="text-right">
              <div
                className="text-[10px] uppercase tracking-widest mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Total
              </div>
              <div
                className="font-sans text-[22px] font-extrabold"
                style={{ color: "var(--primary)" }}
              >
                ฿{currentInvoice.total_thb.toLocaleString("en", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Notes */}
          {currentInvoice.notes && (
            <div
              className="mt-4 pt-4 text-[12px] font-thai"
              style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              {currentInvoice.notes}
            </div>
          )}

          {/* Void reason */}
          {isVoided && currentInvoice.void_reason && (
            <div
              className="mt-4 pt-4 text-[12px] font-thai font-semibold"
              style={{ borderTop: "1px solid var(--border)", color: "var(--danger)" }}
            >
              Void reason: {currentInvoice.void_reason}
            </div>
          )}
        </div>
      </div>

      <VoidInvoiceDialog
        open={voidOpen}
        invoiceNumber={currentInvoice.invoice_number}
        invoiceId={currentInvoice.id}
        onClose={() => setVoidOpen(false)}
        onVoided={(updated) => {
          setCurrentInvoice({ ...currentInvoice, ...updated });
          setVoidOpen(false);
        }}
      />
    </div>
  );
}
