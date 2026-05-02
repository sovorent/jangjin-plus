import { createClient } from "@/lib/supabase/server";
import { InvoiceListClient } from "@/components/invoices/invoice-list-client";
import type { InvoiceWithPatient } from "@/types/supabase";

export default async function InvoicesPage() {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, patients(id, full_name, phone)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <InvoiceListClient initialInvoices={(invoices ?? []) as InvoiceWithPatient[]} />
    </div>
  );
}
