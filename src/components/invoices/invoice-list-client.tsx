"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, XCircle } from "lucide-react";
import type { InvoiceWithPatient, InvoiceStatus } from "@/types/supabase";
import { VoidInvoiceDialog } from "./void-invoice-dialog";

interface Props {
  initialInvoices: InvoiceWithPatient[];
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
        className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold font-thai"
        style={{ background: "var(--danger-light)", color: "var(--danger)" }}
      >
        โมฆะ
      </span>
    );
  }
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold font-thai"
      style={{ background: "var(--success-light)", color: "var(--success)" }}
    >
      ชำระแล้ว
    </span>
  );
}

export function InvoiceListClient({ initialInvoices }: Props) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [filter, setFilter] = useState<"all" | InvoiceStatus>("all");
  const [selected, setSelected] = useState<InvoiceWithPatient | null>(null);
  const [voidOpen, setVoidOpen] = useState(false);

  const filtered =
    filter === "all" ? invoices : invoices.filter((inv) => inv.status === filter);

  const filters: { key: "all" | InvoiceStatus; label: string }[] = [
    { key: "all",  label: "ทั้งหมด" },
    { key: "paid", label: "ชำระแล้ว" },
    { key: "void", label: "โมฆะ" },
  ];

  const snapshot = selected?.clinic_snapshot;
  const isVoided = selected?.status === "void";

  const clinicName = snapshot?.clinic_name_th ?? snapshot?.clinic_name_en ?? "จางจิน คลินิก";
  const address = snapshot?.clinic_address_th ?? snapshot?.clinic_address_en ?? null;
  const addressLine = [address, snapshot?.clinic_phone ? `โทร.${snapshot.clinic_phone}` : null]
    .filter(Boolean).join("  ");
  const doctorLine = [snapshot?.clinic_doctor_name, snapshot?.clinic_tax_id ? `TAX ID ${snapshot.clinic_tax_id}` : null]
    .filter(Boolean).join("  ");

  return (
    <div className="flex h-full">
      {/* ── Left: invoice list ── */}
      <div
        className="w-[360px] min-w-[320px] flex flex-col"
        style={{ borderRight: "1px solid var(--border)" }}
      >
        {/* List header */}
        <div className="px-5 pt-5 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-serif text-[18px] font-semibold" style={{ color: "var(--foreground)" }}>
                ใบเสร็จ
              </div>
              <div className="text-[11px] tracking-wide" style={{ color: "var(--text-muted)" }}>
                Invoices
              </div>
            </div>
          </div>

          {/* Filter tabs */}
          <div
            className="flex gap-1 p-0.5 rounded-lg"
            style={{ background: "var(--background)", border: "1px solid var(--border)" }}
          >
            {filters.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="flex-1 py-1.5 rounded-md text-[12px] font-thai transition-colors"
                style={{
                  background: filter === key ? "var(--primary)" : "transparent",
                  color: filter === key ? "#fff" : "var(--text-secondary)",
                  fontWeight: filter === key ? 600 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* List rows */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-[13px] font-thai" style={{ color: "var(--text-muted)" }}>
              ยังไม่มีใบเสร็จ
            </div>
          ) : (
            filtered.map((inv) => {
              const isSel = selected?.id === inv.id;
              return (
                <button
                  key={inv.id}
                  onClick={() => setSelected(inv)}
                  className="w-full px-5 py-3.5 text-left flex flex-col gap-1 transition-colors border-l-[3px]"
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background: isSel ? "var(--primary-light)" : "transparent",
                    borderLeftColor: isSel ? "var(--primary)" : "transparent",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="font-sans text-[13px] font-bold tracking-wide"
                      style={{ color: isSel ? "var(--primary)" : "var(--foreground)" }}
                    >
                      {inv.invoice_number}
                    </span>
                    <StatusBadge status={inv.status} />
                  </div>
                  <div className="font-thai text-[13px]" style={{ color: "var(--text-secondary)" }}>
                    {inv.patients?.full_name ?? "—"}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {toBuddhistDate(inv.issue_date)}
                    </span>
                    <span className="font-sans text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
                      {fmt(inv.total_thb)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right: invoice preview ── */}
      <div className="flex-1 overflow-y-auto px-7 py-6">
        {!selected ? (
          <div
            className="h-full flex items-center justify-center text-[14px] font-thai"
            style={{ color: "var(--text-muted)" }}
          >
            เลือกใบเสร็จเพื่อดูรายละเอียด
          </div>
        ) : (
          <div>
            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 flex items-center gap-3">
                <div
                  className="font-serif text-[16px] font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  {selected.invoice_number}
                </div>
                <StatusBadge status={selected.status} />
              </div>
              <a
                href={`/invoices/${selected.id}`}
                className="text-[12px] font-thai hover:underline"
                style={{ color: "var(--primary)" }}
              >
                เปิดหน้าเต็ม →
              </a>
              {!isVoided && (
                <>
                  <a
                    href={`/api/invoices/${selected.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-thai transition-opacity hover:opacity-80"
                    style={{ background: "var(--primary-light)", color: "var(--primary)" }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </a>
                  <button
                    onClick={() => setVoidOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-thai transition-opacity hover:opacity-80"
                    style={{ background: "var(--danger-light)", color: "var(--danger)" }}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    โมฆะ
                  </button>
                </>
              )}
            </div>

            {/* Invoice card */}
            <div
              className="rounded-xl relative overflow-hidden"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-md)",
              }}
            >
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
                {/* Centered header */}
                <div className="flex flex-col items-center text-center mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.png"
                    alt="Clinic logo"
                    className="mb-3 object-contain"
                    style={{ maxHeight: 64, maxWidth: 140 }}
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

                <div className="mb-4" style={{ borderBottom: "1px solid var(--border)" }} />

                {/* Title */}
                <div className="text-center font-thai text-[16px] font-semibold mb-4" style={{ color: "var(--foreground)" }}>
                  ใบเสร็จรับเงิน/Receipt
                </div>

                {/* Meta */}
                <div className="flex flex-col items-end mb-4 gap-1">
                  <div className="font-thai text-[12px]" style={{ color: "var(--foreground)" }}>
                    <span style={{ color: "var(--text-muted)" }}>เลขที่: </span>
                    {selected.invoice_number}
                  </div>
                  <div className="font-thai text-[12px]" style={{ color: "var(--foreground)" }}>
                    <span style={{ color: "var(--text-muted)" }}>วันที่: </span>
                    {toBuddhistDate(selected.issue_date)}
                  </div>
                </div>

                {/* Patient */}
                <div className="font-thai text-[13px] mb-5" style={{ color: "var(--foreground)" }}>
                  ชื่อ คุณ{" "}
                  <Link
                    href={`/patients/${selected.patient_id}`}
                    className="font-semibold hover:underline"
                    style={{ color: "var(--foreground)" }}
                  >
                    {selected.patients?.full_name ?? "—"}
                  </Link>
                </div>

                {/* Table */}
                <table className="w-full border-collapse mb-0">
                  <thead>
                    <tr style={{ background: "var(--background)", borderTop: "1px solid #888", borderBottom: "1px solid #888" }}>
                      {[
                        { label: "ลำดับ", align: "text-center", cls: "w-10" },
                        { label: "รายการ",  align: "text-left",   cls: "" },
                        { label: "จำนวน",  align: "text-center", cls: "w-14" },
                        { label: "หน่วย",   align: "text-center", cls: "w-14" },
                        { label: "ราคา",    align: "text-right",  cls: "w-20" },
                      ].map(({ label, align, cls }) => (
                        <th
                          key={label}
                          className={`py-2 px-2 text-[11px] font-semibold font-thai ${align} ${cls}`}
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selected.line_items.map((item, i) => (
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

                {/* Total */}
                <div
                  className="flex justify-end items-center gap-6 pt-3"
                  style={{ borderTop: "1px solid #888" }}
                >
                  <span className="font-thai text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
                    รวมทั้งสิ้น
                  </span>
                  <span className="font-sans text-[15px] font-bold w-20 text-right" style={{ color: "var(--foreground)" }}>
                    {fmt(selected.total_thb)}
                  </span>
                </div>

                {/* Void reason */}
                {isVoided && selected.void_reason && (
                  <div
                    className="mt-4 pt-4 text-[12px] font-thai font-semibold"
                    style={{ borderTop: "1px solid var(--border)", color: "var(--danger)" }}
                  >
                    Void reason: {selected.void_reason}
                  </div>
                )}

                {/* Signature block */}
                <div className="flex justify-between mt-10">
                  <span className="font-thai text-[12px]" style={{ color: "var(--text-secondary)" }}>
                    วันที่ ............................................
                  </span>
                  <span className="font-thai text-[12px]" style={{ color: "var(--text-secondary)" }}>
                    ผู้รับเงิน ............................................
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <VoidInvoiceDialog
        open={voidOpen}
        invoiceNumber={selected?.invoice_number ?? ""}
        invoiceId={selected?.id ?? ""}
        onClose={() => setVoidOpen(false)}
        onVoided={(updated) => {
          if (selected) {
            const updatedInv = { ...selected, ...updated };
            setSelected(updatedInv as InvoiceWithPatient);
            setInvoices((prev) =>
              prev.map((inv) => (inv.id === selected.id ? updatedInv as InvoiceWithPatient : inv))
            );
          }
          setVoidOpen(false);
        }}
      />
    </div>
  );
}
