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
    <div className="px-6 md:px-8 py-6 max-w-3xl">
      <Link
        href="/invoices"
        className="inline-flex items-center gap-1 mb-5 text-[13px] font-thai transition-opacity hover:opacity-70"
        style={{ color: "var(--text-muted)" }}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        {t("title")}
      </Link>

      <InvoiceDetailClient
        invoice={
          invoice as Invoice & { patients: Pick<Patient, "id" | "full_name" | "phone"> }
        }
      />
    </div>
  );
}
