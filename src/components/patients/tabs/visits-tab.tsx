"use client";

import { useTranslations } from "next-intl";
import { format } from "date-fns";
import type { TreatmentLog, TreatmentTag } from "@/types/supabase";

interface Props {
  visits: TreatmentLog[];
}

export function VisitsTab({ visits }: Props) {
  const t = useTranslations("patients.profile");
  const tTags = useTranslations("checkin.tags");

  if (visits.length === 0) {
    return (
      <div
        className="rounded-xl p-8 text-center text-[14px] font-thai"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
        }}
      >
        {t("no_visits")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visits.map((visit) => (
        <div
          key={visit.id}
          className="rounded-xl px-5 py-4"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <p
            className="font-sans text-[13px] font-semibold mb-2"
            style={{ color: "var(--foreground)" }}
          >
            {format(new Date(visit.visit_date), "dd/MM/yyyy")}
          </p>

          {visit.treatment_tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {visit.treatment_tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-2 py-0.5 rounded-full text-[11px] font-thai"
                  style={{
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                  }}
                >
                  {tTags(tag as TreatmentTag)}
                </span>
              ))}
            </div>
          )}

          {visit.treatment_notes && (
            <p
              className="text-[13px] font-thai leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {visit.treatment_notes}
            </p>
          )}

          {visit.herbs_prescribed && (
            <p className="text-[12px] mt-1.5" style={{ color: "var(--text-muted)" }}>
              <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Herbs: </span>
              {visit.herbs_prescribed}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
