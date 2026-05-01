import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { InvoiceListClient } from "@/components/invoices/invoice-list-client";
import type { InvoiceWithPatient } from "@/types/supabase";

export default async function InvoicesPage() {
  const t = await getTranslations("invoices");
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, patients(id, full_name, phone)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">{t("title")}</h1>
      <InvoiceListClient initialInvoices={(invoices ?? []) as InvoiceWithPatient[]} />
    </div>
  );
}
