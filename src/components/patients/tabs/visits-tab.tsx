"use client";

import { useTranslations } from "next-intl";
import { format } from "date-fns";
import type { TreatmentLog, TreatmentTag } from "@/types/supabase";
import { Badge } from "@/components/ui/badge";

interface Props {
  visits: TreatmentLog[];
}

export function VisitsTab({ visits }: Props) {
  const t = useTranslations("patients.profile");
  const tTags = useTranslations("checkin.tags");

  if (visits.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-6 text-center text-muted-foreground text-sm">
        {t("no_visits")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visits.map((visit) => (
        <div key={visit.id} className="rounded-lg border bg-white p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">
              {format(new Date(visit.visit_date), "dd/MM/yyyy")}
            </p>
          </div>
          {visit.treatment_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {visit.treatment_tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tTags(tag as TreatmentTag)}
                </Badge>
              ))}
            </div>
          )}
          {visit.treatment_notes && (
            <p className="text-sm text-muted-foreground">{visit.treatment_notes}</p>
          )}
          {visit.herbs_prescribed && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Herbs:</span> {visit.herbs_prescribed}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
