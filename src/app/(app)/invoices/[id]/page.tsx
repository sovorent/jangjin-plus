import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Invoice, Patient } from "@/types/supabase";
import { InvoiceDetailClient } from "@/components/invoices/invoice-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("invoices");
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, patients(id, full_name, phone)")
    .eq("id", id)
    .single();

  if (!invoice) notFound();

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-4">
        <Link
          href="/invoices"
          className="text-sm text-muted-foreground hover:text-gray-900 flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("title")}
        </Link>
      </div>

      <InvoiceDetailClient invoice={invoice as Invoice & { patients: Pick<Patient, "id" | "full_name" | "phone"> }} />
    </div>
  );
}
