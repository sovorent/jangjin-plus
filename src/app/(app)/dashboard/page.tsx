import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { format } from "date-fns";
import { UserPlus, Activity } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const [
    { count: checkinCount },
    { data: todayInvoices },
    { data: recentPatients },
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
      .select("id, full_name, nickname, phone, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("invoices")
      .select("id, invoice_number, total_thb, status, issue_date, patients(full_name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const todayRevenue = (todayInvoices ?? []).reduce(
    (sum: number, inv: { total_thb: number }) => sum + inv.total_thb,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {format(new Date(), "EEEE, dd MMMM yyyy")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("checkins_today")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#0F4C81]">{checkinCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("invoices_today")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#0F4C81]">{(todayInvoices ?? []).length}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("revenue_today")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#0F4C81]">
              ฿{todayRevenue.toLocaleString("en", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">{t("quick_actions")}</h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/patients/new">
              <UserPlus className="h-4 w-4 mr-2" />
              {t("new_patient")}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/patients">
              <Activity className="h-4 w-4 mr-2" />
              {t("check_in")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent patients */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">{t("recent_patients")}</h2>
            <Link href="/patients" className="text-xs text-[#0F4C81] hover:underline">
              {t("view_all")}
            </Link>
          </div>
          <div className="rounded-lg border bg-white divide-y">
            {(recentPatients ?? []).length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">No patients yet.</p>
            ) : (
              (recentPatients ?? []).map((p) => (
                <Link
                  key={p.id}
                  href={`/patients/${p.id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{(p as Patient).full_name ?? "—"}</p>
                    {(p as Patient).phone && (
                      <p className="text-xs text-muted-foreground">{(p as Patient).phone}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date((p as Patient).created_at), "dd/MM")}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent invoices */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">{t("recent_invoices")}</h2>
            <Link href="/invoices" className="text-xs text-[#0F4C81] hover:underline">
              {t("view_all")}
            </Link>
          </div>
          <div className="rounded-lg border bg-white divide-y">
            {(recentInvoices ?? []).length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">No invoices yet.</p>
            ) : (
              (recentInvoices ?? []).map((inv) => {
                const i = inv as unknown as DashboardInvoice;
                const patientName = Array.isArray(i.patients)
                  ? i.patients[0]?.full_name
                  : i.patients?.full_name;
                return (
                <Link
                  key={i.id}
                  href={`/invoices/${i.id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{i.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {patientName ?? "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      ฿{i.total_thb.toLocaleString("en", { minimumFractionDigits: 2 })}
                    </p>
                    {i.status === "void" && (
                      <Badge variant="destructive" className="text-xs">VOID</Badge>
                    )}
                  </div>
                </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
