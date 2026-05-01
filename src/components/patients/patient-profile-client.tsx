"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { Patient, EnrollmentWithCourse, TreatmentLog, Invoice } from "@/types/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PatientForm } from "./patient-form";
import { OverviewTab } from "./tabs/overview-tab";
import { CoursesTab } from "./tabs/courses-tab";
import { VisitsTab } from "./tabs/visits-tab";
import { InvoicesTab } from "./tabs/invoices-tab";

interface Props {
  patient: Patient;
  enrollments: EnrollmentWithCourse[];
  visits: TreatmentLog[];
  invoices: Invoice[];
}

export function PatientProfileClient({ patient, enrollments, visits, invoices }: Props) {
  const t = useTranslations("patients.profile");
  const router = useRouter();
  const [currentPatient, setCurrentPatient] = useState(patient);
  const [currentEnrollments, setCurrentEnrollments] = useState(enrollments);
  const [editing, setEditing] = useState(false);

  const displayName = currentPatient.full_name ?? currentPatient.phone ?? "Patient";

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{displayName}</h1>
          {currentPatient.nickname && (
            <p className="text-muted-foreground">{currentPatient.nickname}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing((e) => !e)}
          >
            {editing ? "Cancel" : "Edit"}
          </Button>
          <Button
            size="sm"
            onClick={() => router.push(`/patients/${currentPatient.id}/checkin`)}
          >
            {t("check_in_button")}
          </Button>
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
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">{t("tab_overview")}</TabsTrigger>
            <TabsTrigger value="courses">
              {t("tab_courses")}
              {currentEnrollments.filter((e) => e.status === "active").length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {currentEnrollments.filter((e) => e.status === "active").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="visits">{t("tab_visits")}</TabsTrigger>
            <TabsTrigger value="invoices">{t("tab_invoices")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab patient={currentPatient} />
          </TabsContent>

          <TabsContent value="courses">
            <CoursesTab
              patient={currentPatient}
              enrollments={currentEnrollments}
              onEnrollmentsChanged={setCurrentEnrollments}
            />
          </TabsContent>

          <TabsContent value="visits">
            <VisitsTab visits={visits} />
          </TabsContent>

          <TabsContent value="invoices">
            <InvoicesTab invoices={invoices} />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}
