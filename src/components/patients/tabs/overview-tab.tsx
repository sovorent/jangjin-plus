"use client";

import { useTranslations } from "next-intl";
import { format } from "date-fns";
import type { Patient } from "@/types/supabase";
import { Separator } from "@/components/ui/separator";

interface Props {
  patient: Patient;
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <span className="text-sm text-muted-foreground w-40 shrink-0">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

export function OverviewTab({ patient }: Props) {
  const t = useTranslations("patients.form");

  const genderMap: Record<string, string> = {
    male: t("gender_male"),
    female: t("gender_female"),
    other: t("gender_other"),
    prefer_not_to_say: t("gender_prefer_not"),
  };

  const sourceMap: Record<string, string> = {
    facebook: t("source_facebook"),
    walk_in: t("source_walk_in"),
    referral: t("source_referral"),
    other: t("source_other"),
  };

  return (
    <div className="rounded-lg border bg-white p-5 space-y-3">
      <Row label={t("full_name")} value={patient.full_name} />
      <Row label={t("nickname")} value={patient.nickname} />
      <Row label={t("phone")} value={patient.phone} />
      <Row label={t("line_id")} value={patient.line_id} />
      <Row
        label={t("date_of_birth")}
        value={patient.date_of_birth ? format(new Date(patient.date_of_birth), "dd/MM/yyyy") : null}
      />
      <Row
        label={t("gender")}
        value={patient.gender ? genderMap[patient.gender] : null}
      />
      <Row
        label={t("source")}
        value={patient.source ? sourceMap[patient.source] : null}
      />
      {patient.conditions_allergies && (
        <>
          <Separator />
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">{t("conditions_allergies")}</span>
            <p className="text-sm whitespace-pre-wrap">{patient.conditions_allergies}</p>
          </div>
        </>
      )}
    </div>
  );
}
