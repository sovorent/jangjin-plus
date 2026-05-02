"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Edit2, CalendarCheck } from "lucide-react";
import type { Patient, EnrollmentWithCourse, TreatmentLog, Invoice, Appointment } from "@/types/supabase";
import { PatientForm } from "./patient-form";
import { OverviewTab } from "./tabs/overview-tab";
import { CoursesTab } from "./tabs/courses-tab";
import { VisitsTab } from "./tabs/visits-tab";
import { InvoicesTab } from "./tabs/invoices-tab";
import { AppointmentsTab } from "@/components/appointments/appointments-tab";

interface Props {
  patient: Patient;
  enrollments: EnrollmentWithCourse[];
  visits: TreatmentLog[];
  invoices: Invoice[];
  appointments: Appointment[];
  defaultDuration: number;
}

const TABS = ["overview", "courses", "visits", "invoices", "appointments"] as const;
type Tab = (typeof TABS)[number];

export function PatientProfileClient({ patient, enrollments, visits, invoices, appointments, defaultDuration }: Props) {
  const t = useTranslations("patients.profile");
  const router = useRouter();
  const [currentPatient, setCurrentPatient] = useState(patient);
  const [currentEnrollments, setCurrentEnrollments] = useState(enrollments);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const displayName = currentPatient.full_name ?? currentPatient.phone ?? "Patient";
  const activeCourseCount = currentEnrollments.filter((e) => e.status === "active").length;

  const tabLabels: Record<Tab, string> = {
    overview: t("tab_overview"),
    courses: t("tab_courses"),
    visits: t("tab_visits"),
    invoices: t("tab_invoices"),
    appointments: t("tab_appointments"),
  };

  /* initials for avatar */
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div
        className="flex items-start justify-between mb-5 px-1"
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-serif text-[15px] font-bold shrink-0"
            style={{ background: "var(--primary-light)", color: "var(--primary)" }}
          >
            {initials}
          </div>

          <div>
            <h1
              className="font-serif text-[20px] font-semibold leading-tight"
              style={{ color: "var(--foreground)" }}
            >
              {displayName}
            </h1>
            {currentPatient.nickname && (
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                {currentPatient.nickname}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editing ? (
            <button
              onClick={() => setEditing(false)}
              className="px-3.5 py-1.5 rounded-lg text-[13px] font-thai transition-opacity hover:opacity-80"
              style={{
                background: "var(--background)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              ยกเลิก
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-thai transition-opacity hover:opacity-80"
              style={{
                background: "var(--background)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
          <button
            onClick={() => router.push(`/patients/${currentPatient.id}/checkin`)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold font-thai transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)", color: "#fff" }}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            {t("check_in_button")}
          </button>
        </div>
      </div>

      {editing ? (
        <div className="mb-6">
          <PatientForm
            patient={currentPatient}
            onSaved={(updated) => {
              setCurrentPatient(updated);
              setEditing(false);
            }}
          />
        </div>
      ) : (
        <>
          {/* ── Tab bar ──────────────────────────────────────── */}
          <div
            className="flex gap-0 mb-4"
            style={{ borderBottom: "2px solid var(--border)" }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="relative px-4 py-2 text-[13px] font-thai transition-colors"
                  style={{
                    color: isActive ? "var(--primary)" : "var(--text-secondary)",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {tabLabels[tab]}
                  {tab === "courses" && activeCourseCount > 0 && (
                    <span
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
                      style={{ background: "var(--primary)", color: "#fff" }}
                    >
                      {activeCourseCount}
                    </span>
                  )}
                  {/* active underline */}
                  {isActive && (
                    <span
                      className="absolute left-0 right-0 bottom-[-2px] h-[2px] rounded-t"
                      style={{ background: "var(--primary)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Tab content ─────────────────────────────────── */}
          {activeTab === "overview" && <OverviewTab patient={currentPatient} />}
          {activeTab === "courses" && (
            <CoursesTab
              patient={currentPatient}
              enrollments={currentEnrollments}
              onEnrollmentsChanged={setCurrentEnrollments}
            />
          )}
          {activeTab === "visits" && <VisitsTab visits={visits} />}
          {activeTab === "invoices" && <InvoicesTab invoices={invoices} />}
          {activeTab === "appointments" && (
            <AppointmentsTab
              patient={currentPatient}
              appointments={appointments}
              defaultDuration={defaultDuration}
            />
          )}
        </>
      )}
    </div>
  );
}
