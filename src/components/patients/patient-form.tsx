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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

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
          <Select
            defaultValue={patient?.gender ?? undefined}
            onValueChange={(v) => setValue("gender", v as Gender)}
          >
            <SelectTrigger>
              <SelectValue placeholder={tCommon("optional")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">{t("gender_male")}</SelectItem>
              <SelectItem value="female">{t("gender_female")}</SelectItem>
              <SelectItem value="other">{t("gender_other")}</SelectItem>
              <SelectItem value="prefer_not_to_say">{t("gender_prefer_not")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t("source")}</Label>
          <Select
            defaultValue={patient?.source ?? undefined}
            onValueChange={(v) => setValue("source", v as PatientSource)}
          >
            <SelectTrigger>
              <SelectValue placeholder={tCommon("optional")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="facebook">{t("source_facebook")}</SelectItem>
              <SelectItem value="walk_in">{t("source_walk_in")}</SelectItem>
              <SelectItem value="referral">{t("source_referral")}</SelectItem>
              <SelectItem value="other">{t("source_other")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="conditions_allergies">{t("conditions_allergies")}</Label>
        <Textarea
          id="conditions_allergies"
          rows={3}
          placeholder={t("conditions_allergies_placeholder")}
          {...register("conditions_allergies")}
        />
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
