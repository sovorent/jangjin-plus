"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Patient, Gender, PatientSource } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { SimpleSelect } from "@/components/ui/simple-select";

const patientSchema = z
  .object({
    full_name: z.string().optional(),
    nickname: z.string().optional(),
    phone: z.string().optional(),
    line_id: z.string().optional(),
    date_of_birth: z.string().optional(),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
    conditions_allergies: z.string().optional(),
    source: z.enum(["facebook", "walk_in", "referral", "other"]).optional(),
    patient_number: z.string().optional(),
    id_card_number: z.string().optional(),
  })
  .refine((d) => d.full_name?.trim() || d.phone?.trim(), {
    message: "validation_identity",
    path: ["full_name"],
  });

export type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormProps {
  patient?: Patient;
  onSaved?: (patient: Patient) => void;
}

export function PatientForm({ patient, onSaved }: PatientFormProps) {
  const t = useTranslations("patients.form");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [phoneWarning, setPhoneWarning] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      full_name: patient?.full_name ?? "",
      nickname: patient?.nickname ?? "",
      phone: patient?.phone ?? "",
      line_id: patient?.line_id ?? "",
      date_of_birth: patient?.date_of_birth ?? "",
      gender: (patient?.gender as Gender) ?? undefined,
      conditions_allergies: patient?.conditions_allergies ?? "",
      source: (patient?.source as PatientSource) ?? undefined,
      patient_number: patient?.patient_number ?? "",
      id_card_number: patient?.id_card_number ?? "",
    },
  });

  async function checkPhoneDuplicate(phone: string) {
    if (!phone.trim()) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("patients")
      .select("id, full_name")
      .eq("phone", phone.trim())
      .neq("id", patient?.id ?? "")
      .limit(1)
      .single();

    if (data) {
      setPhoneWarning(t("phone_duplicate_warning", { name: data.full_name ?? "unknown" }));
    } else {
      setPhoneWarning(null);
    }
  }

  async function onSubmit(values: PatientFormValues) {
    const supabase = createClient();
    const payload = {
      full_name: values.full_name || null,
      nickname: values.nickname || null,
      phone: values.phone || null,
      line_id: values.line_id || null,
      date_of_birth: values.date_of_birth || null,
      gender: values.gender ?? null,
      conditions_allergies: values.conditions_allergies || null,
      source: values.source ?? null,
      patient_number: values.patient_number || null,
      id_card_number: values.id_card_number || null,
    };

    if (patient) {
      const { data, error } = await supabase
        .from("patients")
        .update(payload)
        .eq("id", patient.id)
        .select()
        .single();
      if (error) { toast.error(t("save_error")); return; }
      toast.success(t("save_success"));
      onSaved?.(data as Patient);
    } else {
      const { data, error } = await supabase
        .from("patients")
        .insert(payload)
        .select()
        .single();
      if (error) { toast.error(t("save_error")); return; }
      toast.success(t("save_success"));
      router.push(`/patients/${(data as Patient).id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">{t("full_name")}</Label>
          <Input
            id="full_name"
            placeholder={t("full_name_placeholder")}
            {...register("full_name")}
          />
          {errors.full_name && (
            <p className="text-xs text-red-600">
              {errors.full_name.message === "validation_identity"
                ? t("validation_identity")
                : errors.full_name.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nickname">{t("nickname")}</Label>
          <Input
            id="nickname"
            placeholder={t("nickname_placeholder")}
            {...register("nickname")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input
            id="phone"
            placeholder={t("phone_placeholder")}
            {...register("phone")}
            onBlur={(e) => checkPhoneDuplicate(e.target.value)}
          />
          {phoneWarning && (
            <p className="text-xs text-amber-600">{phoneWarning}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="line_id">{t("line_id")}</Label>
          <Input
            id="line_id"
            placeholder={t("line_id_placeholder")}
            {...register("line_id")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date_of_birth">{t("date_of_birth")}</Label>
          <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("gender")}</Label>
          <SimpleSelect
            defaultValue={patient?.gender ?? ""}
            onValueChange={(v) => setValue("gender", v as Gender)}
            placeholder={tCommon("optional")}
            options={[
              { value: "male", label: t("gender_male") },
              { value: "female", label: t("gender_female") },
              { value: "other", label: t("gender_other") },
              { value: "prefer_not_to_say", label: t("gender_prefer_not") },
            ]}
          />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t("source")}</Label>
          <SimpleSelect
            defaultValue={patient?.source ?? ""}
            onValueChange={(v) => setValue("source", v as PatientSource)}
            placeholder={tCommon("optional")}
            options={[
              { value: "facebook", label: t("source_facebook") },
              { value: "walk_in", label: t("source_walk_in") },
              { value: "referral", label: t("source_referral") },
              { value: "other", label: t("source_other") },
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="patient_number">{t("patient_number")}</Label>
          <Input
            id="patient_number"
            placeholder={t("patient_number_placeholder")}
            {...register("patient_number")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="id_card_number">{t("id_card_number")}</Label>
          <Input
            id="id_card_number"
            placeholder={t("id_card_number_placeholder")}
            {...register("id_card_number")}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="conditions_allergies">{t("conditions_allergies")}</Label>
          <Textarea
            id="conditions_allergies"
            rows={3}
            placeholder={t("conditions_allergies_placeholder")}
            {...register("conditions_allergies")}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? tCommon("saving") : tCommon("save")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
