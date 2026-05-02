"use client";

import { useTranslations } from "next-intl";
import { format } from "date-fns";
import type { Patient } from "@/types/supabase";

interface Props {
  patient: Patient;
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div
      className="grid items-start py-2.5"
      style={{
        gridTemplateColumns: "160px 1fr",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span
        className="text-[12px] uppercase tracking-wide"
        style={{ color: "var(--text-muted)", paddingTop: "1px" }}
      >
        {label}
      </span>
      <span
        className="font-thai text-[14px]"
        style={{ color: "var(--foreground)" }}
      >
        {value}
      </span>
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
    facebook: "Facebook",
    walk_in: t("source_walk_in"),
    referral: t("source_referral"),
    other: t("source_other"),
  };

  return (
    <div
      className="rounded-xl px-6 py-1"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <Row label={t("full_name")} value={patient.full_name} />
      <Row label={t("nickname")} value={patient.nickname} />
      <Row label={t("phone")} value={patient.phone} />
      <Row label={t("line_id")} value={patient.line_id} />
      <Row
        label={t("date_of_birth")}
        value={
          patient.date_of_birth
            ? format(new Date(patient.date_of_birth), "dd/MM/yyyy")
            : null
        }
      />
      <Row
        label={t("gender")}
        value={patient.gender ? genderMap[patient.gender] ?? patient.gender : null}
      />
      <Row
        label={t("source")}
        value={patient.source ? sourceMap[patient.source] ?? patient.source : null}
      />

      {patient.conditions_allergies && (
        <div className="py-3">
          <div
            className="text-[11px] uppercase tracking-wide mb-1.5"
            style={{ color: "var(--text-muted)" }}
          >
            {t("conditions_allergies")}
          </div>
          <p
            className="font-thai text-[14px] whitespace-pre-wrap leading-relaxed"
            style={{ color: "var(--foreground)" }}
          >
            {patient.conditions_allergies}
          </p>
        </div>
      )}
    </div>
  );
}
