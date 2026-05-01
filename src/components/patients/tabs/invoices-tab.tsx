"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { format } from "date-fns";
import type { Invoice } from "@/types/supabase";
import { Badge } from "@/components/ui/badge";

interface Props {
  invoices: Invoice[];
}

export function InvoicesTab({ invoices }: Props) {
  const t = useTranslations("patients.profile");
  const tInv = useTranslations("invoices");

  if (invoices.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-6 text-center text-muted-foreground text-sm">
        {t("no_invoices")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {invoices.map((inv) => (
        <Link
          key={inv.id}
          href={`/invoices/${inv.id}`}
          className="flex items-center justify-between rounded-lg border bg-white p-4 hover:bg-gray-50 transition-colors"
        >
          <div>
            <p className="font-medium text-sm">{inv.invoice_number}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(inv.issue_date), "dd/MM/yyyy")} ·{" "}
              {inv.type === "course_purchase"
                ? tInv("type_course_purchase")
                : inv.type === "walk_in"
                ? tInv("type_walk_in")
                : tInv("type_manual")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium text-sm">
              ฿{inv.total_thb.toLocaleString("en", { minimumFractionDigits: 2 })}
            </span>
            {inv.status === "void" && (
              <Badge variant="destructive" className="text-xs">
                {tInv("filter_void")}
              </Badge>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
