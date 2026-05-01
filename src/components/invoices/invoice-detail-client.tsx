"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { format } from "date-fns";
import { Download, XCircle } from "lucide-react";
import type { Invoice, Patient } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { VoidInvoiceDialog } from "./void-invoice-dialog";

interface Props {
  invoice: Invoice & { patients: Pick<Patient, "id" | "full_name" | "phone"> };
}

export function InvoiceDetailClient({ invoice }: Props) {
  const t = useTranslations("invoices");
  const [currentInvoice, setCurrentInvoice] = useState(invoice);
  const [voidOpen, setVoidOpen] = useState(false);

  const snapshot = currentInvoice.clinic_snapshot;
  const isVoided = currentInvoice.status === "void";

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{currentInvoice.invoice_number}</h1>
          {isVoided ? (
            <Badge variant="destructive">{t("filter_void")}</Badge>
          ) : (
            <Badge className="bg-emerald-100 text-emerald-700">{t("filter_paid")}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/api/invoices/${currentInvoice.id}/pdf`, "_blank")}
          >
            <Download className="h-4 w-4 mr-1" />
            {t("download_pdf")}
          </Button>
          {!isVoided && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={() => setVoidOpen(true)}
            >
              <XCircle className="h-4 w-4 mr-1" />
              {t("void_invoice")}
            </Button>
          )}
        </div>
      </div>

      {/* Invoice card */}
      <div className={`rounded-lg border bg-white p-6 space-y-5 relative ${isVoided ? "opacity-75" : ""}`}>
        {isVoided && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-6xl font-black text-red-600/30 rotate-[-30deg] select-none tracking-widest">
              VOID
            </span>
          </div>
        )}

        {/* Clinic header */}
        <div>
          <p className="font-semibold text-lg">
            {snapshot.clinic_name_en ?? snapshot.clinic_name_th ?? "—"}
          </p>
          {snapshot.clinic_name_th && snapshot.clinic_name_en && (
            <p className="text-sm text-muted-foreground">{snapshot.clinic_name_th}</p>
          )}
          {snapshot.clinic_address_en && (
            <p className="text-sm text-muted-foreground">{snapshot.clinic_address_en}</p>
          )}
          {snapshot.clinic_phone && (
            <p className="text-sm text-muted-foreground">{snapshot.clinic_phone}</p>
          )}
          {snapshot.clinic_tax_id && (
            <p className="text-sm text-muted-foreground">Tax ID: {snapshot.clinic_tax_id}</p>
          )}
        </div>

        <div className="flex justify-between text-sm">
          <div>
            <p className="text-muted-foreground">{t("detail.bill_to")}</p>
            <Link href={`/patients/${currentInvoice.patient_id}`} className="font-medium hover:underline">
              {currentInvoice.patients.full_name ?? "—"}
            </Link>
            {currentInvoice.patients.phone && (
              <p className="text-muted-foreground">{currentInvoice.patients.phone}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Invoice #</p>
            <p className="font-medium">{currentInvoice.invoice_number}</p>
            <p className="text-muted-foreground mt-1">Date</p>
            <p>{format(new Date(currentInvoice.issue_date), "dd/MM/yyyy")}</p>
          </div>
        </div>

        <Separator />

        {/* Line items */}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground border-b">
              <th className="text-left pb-2">Description</th>
              <th className="text-right pb-2">Qty</th>
              <th className="text-right pb-2">Unit price</th>
              <th className="text-right pb-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {currentInvoice.line_items.map((item, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2">
                  <p>{item.description_en}</p>
                  {item.description_th && (
                    <p className="text-xs text-muted-foreground">{item.description_th}</p>
                  )}
                </td>
                <td className="text-right py-2">{item.quantity}</td>
                <td className="text-right py-2">
                  ฿{item.unit_price_thb.toLocaleString("en", { minimumFractionDigits: 2 })}
                </td>
                <td className="text-right py-2 font-medium">
                  ฿{item.total_thb.toLocaleString("en", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Separator />

        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            <span>{t("detail.payment_method")}: </span>
            <span className="font-medium text-gray-900">
              {currentInvoice.payment_method === "cash" ? "Cash" : "QR PromptPay"}
            </span>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-sm">{t("detail.total")}</p>
            <p className="text-xl font-bold text-[#0F4C81]">
              ฿{currentInvoice.total_thb.toLocaleString("en", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {currentInvoice.notes && (
          <>
            <Separator />
            <p className="text-sm text-muted-foreground">{currentInvoice.notes}</p>
          </>
        )}

        {isVoided && currentInvoice.void_reason && (
          <>
            <Separator />
            <p className="text-sm text-red-600">
              <span className="font-medium">Void reason: </span>
              {currentInvoice.void_reason}
            </p>
          </>
        )}
      </div>

      <VoidInvoiceDialog
        open={voidOpen}
        invoiceNumber={currentInvoice.invoice_number}
        invoiceId={currentInvoice.id}
        onClose={() => setVoidOpen(false)}
        onVoided={(updated) => {
          setCurrentInvoice({ ...currentInvoice, ...updated });
          setVoidOpen(false);
        }}
      />
    </div>
  );
}
