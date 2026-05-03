"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { ClinicSettings } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SimpleSelect } from "@/components/ui/simple-select";

const settingsSchema = z.object({
  clinic_name_th: z.string().nullable().optional(),
  clinic_name_en: z.string().nullable().optional(),
  clinic_address_th: z.string().nullable().optional(),
  clinic_address_en: z.string().nullable().optional(),
  clinic_phone: z.string().nullable().optional(),
  clinic_tax_id: z.string().nullable().optional(),
  clinic_doctor_name: z.string().nullable().optional(),
  invoice_prefix: z.string().min(1).max(10),
  ui_language_default: z.enum(["en", "th"]),
});
type SettingsValues = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  settings: ClinicSettings | null;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      clinic_name_th: settings?.clinic_name_th ?? "",
      clinic_name_en: settings?.clinic_name_en ?? "",
      clinic_address_th: settings?.clinic_address_th ?? "",
      clinic_address_en: settings?.clinic_address_en ?? "",
      clinic_phone: settings?.clinic_phone ?? "",
      clinic_tax_id: settings?.clinic_tax_id ?? "",
      clinic_doctor_name: settings?.clinic_doctor_name ?? "",
      invoice_prefix: settings?.invoice_prefix ?? "JJ",
      ui_language_default: settings?.ui_language_default ?? "en",
    },
  });

  const [invoicePrefix, setInvoicePrefix] = useState(settings?.invoice_prefix ?? "JJ");

  async function onSubmit(values: SettingsValues) {
    const supabase = createClient();
    const { error } = await supabase
      .from("clinic_settings")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", settings?.id ?? "");

    if (error) {
      toast.error(t("save_error"));
      return;
    }
    toast.success(t("save_success"));
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Clinic Information */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-700">{t("section_clinic")}</h2>
        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="clinic_name_th">{t("clinic_name_th")}</Label>
            <Input id="clinic_name_th" {...register("clinic_name_th")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clinic_name_en">{t("clinic_name_en")}</Label>
            <Input id="clinic_name_en" {...register("clinic_name_en")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clinic_address_th">{t("clinic_address_th")}</Label>
            <Input id="clinic_address_th" {...register("clinic_address_th")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clinic_address_en">{t("clinic_address_en")}</Label>
            <Input id="clinic_address_en" {...register("clinic_address_en")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clinic_phone">{t("clinic_phone")}</Label>
            <Input id="clinic_phone" {...register("clinic_phone")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clinic_tax_id">{t("clinic_tax_id")}</Label>
            <Input id="clinic_tax_id" {...register("clinic_tax_id")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="clinic_doctor_name">{t("clinic_doctor_name")}</Label>
            <Input id="clinic_doctor_name" {...register("clinic_doctor_name")} />
          </div>
        </div>
      </section>

      {/* Invoice Settings */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-700">{t("section_invoice")}</h2>
        <Separator />

        <div className="space-y-1.5">
          <Label htmlFor="invoice_prefix">{t("invoice_prefix")}</Label>
          <Input
            id="invoice_prefix"
            className="max-w-32"
            {...register("invoice_prefix")}
            onChange={(e) => {
              register("invoice_prefix").onChange(e);
              setInvoicePrefix(e.target.value);
            }}
          />
          {errors.invoice_prefix && (
            <p className="text-xs text-red-600">{errors.invoice_prefix.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {t("invoice_prefix_note", {
              prefix: invoicePrefix || "JJ",
            })}
          </p>
        </div>
      </section>

      {/* Language */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-700">{t("section_language")}</h2>
        <Separator />

        <div className="space-y-1.5">
          <Label>{t("ui_language")}</Label>
          <SimpleSelect
            defaultValue={settings?.ui_language_default ?? "en"}
            onValueChange={(v) => setValue("ui_language_default", v as "en" | "th")}
            className="w-48"
            options={[
              { value: "en", label: "English" },
              { value: "th", label: "ภาษาไทย" },
            ]}
          />
        </div>
      </section>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? tCommon("saving") : tCommon("save")}
      </Button>
    </form>
  );
}
