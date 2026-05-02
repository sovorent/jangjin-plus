import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Patient, InvoiceStatus } from "@/types/supabase";

interface DashboardInvoice {
  id: string;
  invoice_number: string;
  total_thb: number;
  status: InvoiceStatus;
  issue_date: string;
  patients: { full_name: string | null } | { full_name: string | null }[] | null;
}

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const currentMonth = format(new Date(), "yyyy-MM");

  const [
    { count: checkinCount },
    { data: todayInvoices },
    { count: totalPatients },
    { data: recentInvoices },
  ] = await Promise.all([
    supabase
      .from("treatment_logs")
      .select("id", { count: "exact" })
      .eq("visit_date", today),
    supabase
      .from("invoices")
      .select("total_thb, status")
      .eq("issue_date", today)
      .eq("status", "paid"),
    supabase
      .from("patients")
      .select("id", { count: "exact" }),
    supabase
      .from("invoices")
      .select("id, invoice_number, total_thb, status, issue_date, patients(full_name)")
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const todayRevenue = (todayInvoices ?? []).reduce(
    (sum: number, inv: { total_thb: number }) => sum + inv.total_thb,
    0
  );

  const thaiMonth = MONTHS_TH[new Date().getMonth()];
  const buddhistYear = new Date().getFullYear() + 543;

  const statCards = [
    {
      labelTH: "รายได้วันนี้",
      labelEN: "Today's Revenue",
      value: `฿${todayRevenue.toLocaleString("en")}`,
      delta: "+12%",
      dotColor: "var(--gold)",
      deltaBg: "var(--gold-light)",
      deltaColor: "var(--gold)",
    },
    {
      labelTH: "คนไข้ทั้งหมด",
      labelEN: "Total Patients",
      value: String(totalPatients ?? 0),
      delta: "ทั้งหมด",
      dotColor: "var(--primary)",
      deltaBg: "var(--primary-light)",
      deltaColor: "var(--primary)",
    },
    {
      labelTH: "เช็กอินวันนี้",
      labelEN: "Today's Visits",
      value: String(checkinCount ?? 0),
      delta: "วันนี้",
      dotColor: "var(--success)",
      deltaBg: "var(--success-light)",
      deltaColor: "var(--success)",
    },
    {
      labelTH: "ใบเสร็จวันนี้",
      labelEN: "Today's Invoices",
      value: String((todayInvoices ?? []).length),
      delta: "ใบ",
      dotColor: "var(--teal)",
      deltaBg: "var(--teal-light)",
      deltaColor: "var(--teal)",
    },
  ];

  return (
    <div className="p-7 md:p-8 space-y-7 max-w-none">
      {/* Page header */}
      <div>
        <h1
          className="font-serif text-[22px] font-semibold tracking-wide"
          style={{ color: "var(--foreground)" }}
        >
          หน้าหลัก
        </h1>
        <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          {thaiMonth} {buddhistYear} · Dashboard
        </p>
      </div>

      {/* Stat cards — 4 columns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div
            key={i}
            className="rounded-xl p-4 md:p-5"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: s.dotColor }}
              />
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: s.deltaBg, color: s.deltaColor }}
              >
                {s.delta}
              </span>
            </div>
            <div
              className="font-serif text-2xl font-semibold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              {s.value}
            </div>
            <div
              className="font-thai text-[12px] mt-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {s.labelTH}
            </div>
            <div
              className="text-[10px] tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              {s.labelEN}
            </div>
          </div>
        ))}
      </div>

      {/* Main content: appointments list + sidebar panels */}
      <div className="grid md:grid-cols-[1fr_340px] gap-5">
        {/* Recent invoices acting as "recent activity" */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div>
              <div
                className="font-thai text-[14px] font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                ใบเสร็จล่าสุด
              </div>
              <div
                className="text-[11px] tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                Recent Invoices
              </div>
            </div>
            <Link
              href="/invoices"
              className="flex items-center gap-0.5 text-[11px] transition-opacity hover:opacity-70"
              style={{ color: "var(--primary)" }}
            >
              ดูทั้งหมด <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div>
            {(recentInvoices ?? []).length === 0 ? (
              <div
                className="px-5 py-10 text-center text-[13px] font-thai"
                style={{ color: "var(--text-muted)" }}
              >
                ยังไม่มีใบเสร็จ
              </div>
            ) : (
              (recentInvoices ?? []).map((inv, i) => {
                const item = inv as unknown as DashboardInvoice;
                const patientName = Array.isArray(item.patients)
                  ? item.patients[0]?.full_name
                  : item.patients?.full_name;
                const isVoid = item.status === "void";
                return (
                  <Link
                    key={item.id}
                    href={`/invoices/${item.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                    style={{
                      borderBottom:
                        i < (recentInvoices ?? []).length - 1
                          ? "1px solid var(--border)"
                          : "none",
                    }}
                  >
                    <div
                      className="min-w-12 text-center"
                    >
                      <div
                        className="font-serif text-[13px] font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {format(new Date(item.issue_date), "dd")}
                      </div>
                      <div
                        className="text-[10px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {MONTHS_TH[new Date(item.issue_date).getMonth()]}
                      </div>
                    </div>
                    <div
                      className="w-px self-stretch"
                      style={{ background: "var(--border)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-sans text-[13px] font-semibold truncate"
                        style={{ color: "var(--foreground)" }}
                      >
                        {patientName ?? "—"}
                      </div>
                      <div
                        className="text-[11px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {item.invoice_number}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className="font-sans text-[13px] font-semibold"
                        style={{ color: isVoid ? "var(--text-muted)" : "var(--foreground)", textDecoration: isVoid ? "line-through" : "none" }}
                      >
                        ฿{item.total_thb.toLocaleString("en")}
                      </div>
                      {isVoid ? (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: "var(--danger-light)", color: "var(--danger)" }}
                        >
                          โมฆะ
                        </span>
                      ) : (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: "var(--success-light)", color: "var(--success)" }}
                        >
                          ชำระแล้ว
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: mini chart + quick actions */}
        <div className="flex flex-col gap-4">
          {/* Revenue bar chart (decorative) */}
          <div
            className="rounded-xl p-4 md:p-5"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              className="font-thai text-[14px] font-semibold mb-0.5"
              style={{ color: "var(--foreground)" }}
            >
              รายได้รายเดือน
            </div>
            <div
              className="text-[11px] mb-4 tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              Monthly Revenue
            </div>
            <div className="flex items-end gap-1 h-14">
              {[38, 52, 45, 61, 55, 68, 72, 58, 80, 65, 78, 90].map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-[3px] relative"
                  style={{
                    height: `${v}%`,
                    background:
                      i === 11 ? "var(--gold)" : "var(--primary-light)",
                  }}
                >
                  {i === 11 && (
                    <div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 text-[8px] font-bold mb-0.5 whitespace-nowrap"
                      style={{ color: "var(--gold)" }}
                    >
                      ฿67.8k
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                มิ.ย.
              </span>
              <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                พ.ค.
              </span>
            </div>
          </div>

          {/* Quick actions */}
          <div
            className="rounded-xl p-4 md:p-5"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              className="font-thai text-[13px] font-semibold mb-3"
              style={{ color: "var(--foreground)" }}
            >
              ดำเนินการด่วน
            </div>
            <div className="flex flex-col gap-2">
              {[
                { labelTH: "เพิ่มคนไข้ใหม่", labelEN: "New Patient", href: "/patients/new" },
                { labelTH: "Check-in คนไข้", labelEN: "Walk-in Check-in", href: "/patients" },
                { labelTH: "ดูใบเสร็จทั้งหมด", labelEN: "View Invoices", href: "/invoices" },
              ].map((q) => (
                <Link
                  key={q.href}
                  href={q.href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors"
                  style={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <div
                      className="font-thai text-[13px]"
                      style={{ color: "var(--foreground)" }}
                    >
                      {q.labelTH}
                    </div>
                    <div
                      className="text-[10px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {q.labelEN}
                    </div>
                  </div>
                  <ChevronRight
                    className="w-3.5 h-3.5"
                    style={{ color: "var(--text-muted)" }}
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
