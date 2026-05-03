"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Download, XCircle } from "lucide-react";
import type { Invoice, Patient } from "@/types/supabase";
import { VoidInvoiceDialog } from "./void-invoice-dialog";

interface Props {
  invoice: Invoice & { patients: Pick<Patient, "id" | "full_name" | "phone"> };
}

const THAI_MONTHS = [
  "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน",
  "พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม",
  "กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];

function toBuddhistDate(isoDate: string): string {
  const d = new Date(isoDate);
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function fmt(n: number): string {
  return n.toLocaleString("en", { minimumFractionDigits: 2 });
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

  const clinicName = snapshot?.clinic_name_th ?? snapshot?.clinic_name_en ?? "จางจิน คลินิก";
  const address = snapshot?.clinic_address_th ?? snapshot?.clinic_address_en ?? null;
  const addressLine = [address, snapshot?.clinic_phone ? `โทร.${snapshot.clinic_phone}` : null]
    .filter(Boolean)
    .join("  ");
  const doctorLine = [snapshot?.clinic_doctor_name, snapshot?.clinic_tax_id ? `TAX ID ${snapshot.clinic_tax_id}` : null]
    .filter(Boolean)
    .join("  ");

  return (
    <div>
      {/* ── Page toolbar ─────────────────────── */}
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

        <div className="px-8 py-8">

          {/* ── Centered header: logo + clinic info ── */}
          <div className="flex flex-col items-center text-center mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Clinic logo"
              className="mb-3 object-contain"
              style={{ maxHeight: 72, maxWidth: 160 }}
            />
            <div className="font-thai text-[14px] font-bold mb-1" style={{ color: "var(--foreground)" }}>
              {clinicName}
            </div>
            {addressLine && (
              <div className="font-thai text-[11px]" style={{ color: "var(--text-muted)" }}>
                {addressLine}
              </div>
            )}
            {doctorLine && (
              <div className="font-thai text-[11px]" style={{ color: "var(--text-muted)" }}>
                {doctorLine}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="mb-4" style={{ borderBottom: "1px solid var(--border)" }} />

          {/* ── Title ── */}
          <div className="text-center font-thai text-[17px] font-semibold mb-4" style={{ color: "var(--foreground)" }}>
            ใบเสร็จรับเงิน/Receipt
          </div>

          {/* ── Invoice meta — right-aligned ── */}
          <div className="flex flex-col items-end mb-4 gap-1">
            <div className="font-thai text-[12px]" style={{ color: "var(--foreground)" }}>
              <span style={{ color: "var(--text-muted)" }}>เลขที่: </span>
              {currentInvoice.invoice_number}
            </div>
            <div className="font-thai text-[12px]" style={{ color: "var(--foreground)" }}>
              <span style={{ color: "var(--text-muted)" }}>วันที่: </span>
              {toBuddhistDate(currentInvoice.issue_date)}
            </div>
          </div>

          {/* ── Patient name ── */}
          <div className="font-thai text-[13px] mb-5" style={{ color: "var(--foreground)" }}>
            ชื่อ คุณ{" "}
            <Link
              href={`/patients/${currentInvoice.patient_id}`}
              className="font-semibold hover:underline"
              style={{ color: "var(--foreground)" }}
            >
              {currentInvoice.patients.full_name ?? "—"}
            </Link>
          </div>

          {/* ── Line items table ── */}
          <table className="w-full border-collapse mb-0">
            <thead>
              <tr style={{ background: "var(--background)", borderTop: "1px solid #888", borderBottom: "1px solid #888" }}>
                {[
                  { label: "ลำดับ", align: "text-center", width: "w-10" },
                  { label: "รายการ", align: "text-left", width: "" },
                  { label: "จำนวน", align: "text-center", width: "w-16" },
                  { label: "หน่วย", align: "text-center", width: "w-16" },
                  { label: "ราคา", align: "text-right", width: "w-24" },
                ].map(({ label, align, width }) => (
                  <th
                    key={label}
                    className={`py-2 px-2 text-[11px] font-semibold font-thai ${align} ${width}`}
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentInvoice.line_items.map((item, i) => (
                <tr key={i} style={{ borderBottom: "0.5px solid var(--border)" }}>
                  <td className="py-3 px-2 text-center font-thai text-[12px]" style={{ color: "var(--foreground)" }}>
                    {i + 1}
                  </td>
                  <td className="py-3 px-2">
                    <div className="font-thai text-[13px]" style={{ color: "var(--foreground)" }}>
                      {item.description_th}
                    </div>
                    {item.description_en && (
                      <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {item.description_en}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center text-[12px]" style={{ color: "var(--foreground)" }}>
                    {item.quantity}
                  </td>
                  <td className="py-3 px-2 text-center font-thai text-[12px]" style={{ color: "var(--foreground)" }}>
                    {item.unit}
                  </td>
                  <td className="py-3 px-2 text-right font-sans text-[12px]" style={{ color: "var(--foreground)" }}>
                    {fmt(item.total_thb)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Total ── */}
          <div
            className="flex justify-end items-center gap-6 pt-3 mt-0"
            style={{ borderTop: "1px solid #888" }}
          >
            <span className="font-thai text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
              รวมทั้งสิ้น
            </span>
            <span className="font-sans text-[15px] font-bold w-24 text-right" style={{ color: "var(--foreground)" }}>
              {fmt(currentInvoice.total_thb)}
            </span>
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

          {/* ── Signature block ── */}
          <div className="flex justify-between mt-10 pt-2">
            <span className="font-thai text-[12px]" style={{ color: "var(--text-secondary)" }}>
              วันที่ ............................................
            </span>
            <span className="font-thai text-[12px]" style={{ color: "var(--text-secondary)" }}>
              ผู้รับเงิน ............................................
            </span>
          </div>

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
