"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import type { Patient, EnrollmentWithCourse } from "@/types/supabase";
import { EnrollDialog } from "@/components/enrollments/enroll-dialog";
import { CancelEnrollmentDialog } from "@/components/enrollments/cancel-enrollment-dialog";

interface Props {
  patient: Patient;
  enrollments: EnrollmentWithCourse[];
  onEnrollmentsChanged: (updated: EnrollmentWithCourse[]) => void;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    active:    { bg: "var(--success-light)", color: "var(--success)",   label: "กำลังใช้งาน" },
    completed: { bg: "var(--border)",        color: "var(--text-muted)", label: "ครบแล้ว" },
    cancelled: { bg: "var(--danger-light)",  color: "var(--danger)",    label: "ยกเลิก" },
  };
  const s = styles[status] ?? styles.active;
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold font-thai"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

export function CoursesTab({ patient, enrollments, onEnrollmentsChanged }: Props) {
  const t = useTranslations("patients.profile");
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<EnrollmentWithCourse | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={() => setEnrollOpen(true)}
          className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold font-thai transition-opacity hover:opacity-90"
          style={{ background: "var(--primary)", color: "#fff" }}
        >
          + {t("enroll_button")}
        </button>
      </div>

      {enrollments.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center text-[14px] font-thai"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
        >
          {t("no_enrollments")}
        </div>
      ) : (
        enrollments.map((enr) => {
          const remaining = enr.total_sessions - enr.sessions_used;
          const pct = Math.round((enr.sessions_used / enr.total_sessions) * 100);
          return (
            <div
              key={enr.id}
              className="rounded-xl px-5 py-4"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p
                    className="font-thai text-[14px] font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {enr.course_catalog.name_th || enr.course_catalog.name_en}
                  </p>
                  <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                    {enr.course_catalog.name_en}
                  </p>
                </div>
                <StatusBadge status={enr.status} />
              </div>

              {/* Progress bar */}
              <div
                className="w-full h-1.5 rounded-full mb-2 overflow-hidden"
                style={{ background: "var(--border)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background:
                      enr.status === "completed"
                        ? "var(--text-muted)"
                        : "var(--primary)",
                  }}
                />
              </div>

              <div
                className="flex items-center justify-between text-[12px]"
                style={{ color: "var(--text-muted)" }}
              >
                <span className="font-thai">
                  {t("sessions_remaining", { remaining, total: enr.total_sessions })}
                </span>
                <span>
                  {t("enrolled_on", {
                    date: format(new Date(enr.purchase_date), "dd/MM/yyyy"),
                  })}
                </span>
              </div>

              {enr.status === "active" && (
                <button
                  onClick={() => setCancelTarget(enr)}
                  className="mt-3 text-[12px] font-thai transition-opacity hover:opacity-70"
                  style={{ color: "var(--danger)" }}
                >
                  {t("cancel_enrollment")}
                </button>
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
