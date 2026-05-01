"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { format } from "date-fns";
import type { InvoiceWithPatient, InvoiceStatus } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  initialInvoices: InvoiceWithPatient[];
}

export function InvoiceListClient({ initialInvoices }: Props) {
  const t = useTranslations("invoices");
  const [filter, setFilter] = useState<"all" | InvoiceStatus>("all");

  const filtered =
    filter === "all"
      ? initialInvoices
      : initialInvoices.filter((inv) => inv.status === filter);

  return (
    <>
      <div className="flex gap-2 mb-4">
        {(["all", "paid", "void"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? t("filter_all") : f === "paid" ? t("filter_paid") : t("filter_void")}
          </Button>
        ))}
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.number")}</TableHead>
              <TableHead>{t("columns.patient")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("columns.type")}</TableHead>
              <TableHead className="text-right">{t("columns.total")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("columns.date")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t("no_invoices")}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inv) => (
                <TableRow key={inv.id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="font-medium text-[#0F4C81] hover:underline"
                    >
                      {inv.invoice_number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/patients/${inv.patient_id}`}
                      className="hover:underline"
                    >
                      {inv.patients?.full_name ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {inv.type === "course_purchase"
                      ? t("type_course_purchase")
                      : inv.type === "walk_in"
                      ? t("type_walk_in")
                      : t("type_manual")}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ฿{inv.total_thb.toLocaleString("en", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {format(new Date(inv.issue_date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    {inv.status === "void" ? (
                      <Badge variant="destructive" className="text-xs">
                        {t("filter_void")}
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-emerald-100 text-emerald-700"
                      >
                        {t("filter_paid")}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
