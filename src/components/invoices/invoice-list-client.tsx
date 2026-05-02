"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { format } from "date-fns";
import { Download, XCircle } from "lucide-react";
import type { InvoiceWithPatient, InvoiceStatus } from "@/types/supabase";
import { VoidInvoiceDialog } from "./void-invoice-dialog";

interface Props {
  initialInvoices: InvoiceWithPatient[];
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
  const t = useTranslations("invoices");
  const [invoices, setInvoices] = useState(initialInvoices);
  const [filter, setFilter] = useState<"all" | InvoiceStatus>("all");
  const [selected, setSelected] = useState<InvoiceWithPatient | null>(null);
  const [voidOpen, setVoidOpen] = useState(false);

  const filtered =
    filter === "all" ? invoices : invoices.filter((inv) => inv.status === filter);

  const filters: { key: "all" | InvoiceStatus; label: string }[] = [
    { key: "all", label: "ทั้งหมด" },
    { key: "paid", label: "ชำระแล้ว" },
    { key: "void", label: "โมฆะ" },
  ];

  const snapshot = selected?.clinic_snapshot as unknown as Record<string, string> | null;
  const isVoided = selected?.status === "void";

  return (
    <div className="flex h-full">
      {/* Left: list */}
      <div
        className="w-[380px] min-w-[340px] flex flex-col"
        style={{ borderRight: "1px solid var(--border)" }}
      >
        {/* List header */}
        <div
          className="px-5 pt-5 pb-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div
                className="font-serif text-[18px] font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                ใบเสร็จ
              </div>
              <div className="text-[11px] tracking-wide" style={{ color: "var(--text-muted)" }}>
                Invoices
              </div>
            </div>
            <button
              className="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold font-thai transition-opacity hover:opacity-90"
              style={{ background: "var(--primary)", color: "#fff" }}
            >
              + สร้างใหม่
            </button>
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
            <div
              className="py-12 text-center text-[13px] font-thai"
              style={{ color: "var(--text-muted)" }}
            >
              ยังไม่มีใบเสร็จ
            </div>
          ) : (
            filtered.map((inv) => {
              const isSelected = selected?.id === inv.id;
              return (
                <button
                  key={inv.id}
                  onClick={() => setSelected(inv)}
                  className="w-full px-5 py-3.5 text-left flex flex-col gap-1 transition-colors border-l-[3px]"
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background: isSelected ? "var(--primary-light)" : "transparent",
                    borderLeftColor: isSelected ? "var(--primary)" : "transparent",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="font-sans text-[13px] font-bold tracking-wide"
                      style={{ color: isSelected ? "var(--primary)" : "var(--foreground)" }}
                    >
                      {inv.invoice_number}
                    </span>
                    <StatusBadge status={inv.status} />
                  </div>
                  <div
                    className="font-thai text-[13px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {inv.patients?.full_name ?? "—"}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {format(new Date(inv.issue_date), "dd/MM/yyyy")}
                    </span>
                    <span
                      className="font-sans text-[13px] font-semibold"
                      style={{ color: "var(--foreground)" }}
                    >
                      ฿{inv.total_thb.toLocaleString("en")}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right: detail */}
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
              <div className="flex-1">
                <div
                  className="font-serif text-[16px] font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  {selected.invoice_number}
                </div>
                <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {format(new Date(selected.issue_date), "dd/MM/yyyy")}
                </div>
              </div>
              {!isVoided && (
                <>
                  <a
                    href={`/api/invoices/${selected.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold font-thai transition-opacity hover:opacity-80"
                    style={{ background: "var(--primary-light)", color: "var(--primary)" }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    ดาวน์โหลด PDF
                  </a>
                  <button
                    onClick={() => setVoidOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-thai transition-opacity hover:opacity-80"
                    style={{ background: "var(--danger-light)", color: "var(--danger)" }}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    โมฆะ (Void)
                  </button>
                </>
              )}
            </div>

            {/* Invoice card */}
            <div
              className="rounded-xl px-8 py-7 relative overflow-hidden"
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
                    style={{ color: "rgba(220,38,38,0.12)" }}
                  >
                    VOID / โมฆะ
                  </span>
                </div>
              )}

              {/* Clinic header */}
              <div
                className="flex justify-between items-start mb-7 pb-5"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div>
                  <div
                    className="font-serif text-[15px] font-bold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {snapshot?.clinic_name_th ?? "คลินิกจางจิน"}
                  </div>
                  <div
                    className="font-sans text-[12px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {snapshot?.clinic_name_en ?? "JangJin TCM Clinic"}
                  </div>
                  {snapshot?.clinic_address_th && (
                    <div className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                      {snapshot.clinic_address_th}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div
                    className="font-serif text-[13px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    ใบเสร็จรับเงิน
                  </div>
                  <div
                    className="font-sans text-[18px] font-extrabold tracking-wide"
                    style={{ color: "var(--primary)" }}
                  >
                    {selected.invoice_number}
                  </div>
                  <div className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {format(new Date(selected.issue_date), "dd/MM/yyyy")}
                  </div>
                </div>
              </div>

              {/* Patient */}
              <div className="mb-6">
                <div
                  className="text-[10px] uppercase tracking-widest mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  ชื่อคนไข้ / Patient
                </div>
                <Link
                  href={`/patients/${selected.patient_id}`}
                  className="font-thai text-[15px] font-semibold hover:underline"
                  style={{ color: "var(--foreground)" }}
                >
                  {selected.patients?.full_name ?? "—"}
                </Link>
              </div>

              {/* Line items */}
              <table className="w-full border-collapse mb-5">
                <thead>
                  <tr style={{ background: "var(--background)" }}>
                    {["#", "รายการ / Description", "จำนวน / Qty", "ราคา/หน่วย", "รวม"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-2.5 py-2 text-[10px] uppercase tracking-wide font-medium text-left"
                          style={{
                            color: "var(--text-muted)",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {selected.line_items.map((item, i) => (
                    <tr key={i}>
                      <td
                        className="px-2.5 py-3 text-[13px] text-center"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {i + 1}
                      </td>
                      <td className="px-2.5 py-3">
                        <div
                          className="font-thai text-[13px] font-semibold"
                          style={{ color: "var(--foreground)" }}
                        >
                          {item.description_th || item.description_en}
                        </div>
                        <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          {item.description_en}
                        </div>
                      </td>
                      <td
                        className="px-2.5 py-3 text-[13px]"
                        style={{ color: "var(--foreground)" }}
                      >
                        {item.quantity}
                      </td>
                      <td
                        className="px-2.5 py-3 font-sans text-[13px]"
                        style={{ color: "var(--foreground)" }}
                      >
                        ฿{item.unit_price_thb.toLocaleString("en")}
                      </td>
                      <td
                        className="px-2.5 py-3 font-sans text-[13px] font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        ฿{item.total_thb.toLocaleString("en")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total */}
              <div
                className="pt-3.5 flex justify-end"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <div className="min-w-[200px]">
                  <div
                    className="flex justify-between mb-2"
                  >
                    <span
                      className="text-[12px] font-thai"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      ชำระโดย / Payment
                    </span>
                    <span
                      className="text-[12px] font-thai"
                      style={{ color: "var(--foreground)" }}
                    >
                      {selected.payment_method === "cash"
                        ? "เงินสด / Cash"
                        : "QR PromptPay"}
                    </span>
                  </div>
                  <div
                    className="flex justify-between items-center pt-2.5"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <span
                      className="font-serif text-[14px] font-semibold"
                      style={{ color: "var(--foreground)" }}
                    >
                      ยอดรวม / Total
                    </span>
                    <span
                      className="font-sans text-[18px] font-extrabold"
                      style={{ color: "var(--primary)" }}
                    >
                      ฿{selected.total_thb.toLocaleString("en")}.00
                    </span>
                  </div>
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
