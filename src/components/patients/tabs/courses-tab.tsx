"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import type { Patient, EnrollmentWithCourse } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnrollDialog } from "@/components/enrollments/enroll-dialog";
import { CancelEnrollmentDialog } from "@/components/enrollments/cancel-enrollment-dialog";

interface Props {
  patient: Patient;
  enrollments: EnrollmentWithCourse[];
  onEnrollmentsChanged: (updated: EnrollmentWithCourse[]) => void;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

export function CoursesTab({ patient, enrollments, onEnrollmentsChanged }: Props) {
  const t = useTranslations("patients.profile");
  const tEnr = useTranslations("enrollments");
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<EnrollmentWithCourse | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEnrollOpen(true)}>
          {t("enroll_button")}
        </Button>
      </div>

      {enrollments.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-center text-muted-foreground text-sm">
          {t("no_enrollments")}
        </div>
      ) : (
        enrollments.map((enr) => {
          const remaining = enr.total_sessions - enr.sessions_used;
          return (
            <div key={enr.id} className="rounded-lg border bg-white p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{enr.course_catalog.name_en}</p>
                  <p className="text-sm text-muted-foreground">{enr.course_catalog.name_th}</p>
                </div>
                <Badge className={statusColors[enr.status]}>
                  {tEnr(`status_${enr.status}`)}
                </Badge>
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>
                  {t("sessions_remaining", {
                    remaining,
                    total: enr.total_sessions,
                  })}
                </span>
                <span>
                  {t("enrolled_on", {
                    date: format(new Date(enr.purchase_date), "dd/MM/yyyy"),
                  })}
                </span>
              </div>
              {enr.status === "active" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => setCancelTarget(enr)}
                >
                  {t("cancel_enrollment")}
                </Button>
              )}
            </div>
          );
        })
      )}

      <EnrollDialog
        open={enrollOpen}
        patient={patient}
        onClose={() => setEnrollOpen(false)}
        onEnrolled={(newEnr) => {
          onEnrollmentsChanged([newEnr, ...enrollments]);
          setEnrollOpen(false);
        }}
      />

      {cancelTarget && (
        <CancelEnrollmentDialog
          enrollment={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onCancelled={(updated) => {
            onEnrollmentsChanged(
              enrollments.map((e) => (e.id === updated.id ? { ...e, ...updated } : e))
            );
            setCancelTarget(null);
          }}
        />
      )}
    </div>
  );
}
