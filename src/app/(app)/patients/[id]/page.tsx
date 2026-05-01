import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Patient, EnrollmentWithCourse, TreatmentLog, Invoice } from "@/types/supabase";
import { PatientProfileClient } from "@/components/patients/patient-profile-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PatientProfilePage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("patients");
  const supabase = await createClient();

  const [{ data: patient }, { data: enrollments }, { data: visits }, { data: invoices }] =
    await Promise.all([
      supabase.from("patients").select("*").eq("id", id).single(),
      supabase
        .from("enrollments")
        .select("*, course_catalog(*)")
        .eq("patient_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("treatment_logs")
        .select("*")
        .eq("patient_id", id)
        .order("visit_date", { ascending: false }),
      supabase
        .from("invoices")
        .select("*")
        .eq("patient_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (!patient) notFound();

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 mb-4">
        <Link
          href="/patients"
          className="text-sm text-muted-foreground hover:text-gray-900 flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("title")}
        </Link>
      </div>

      <PatientProfileClient
        patient={patient as Patient}
        enrollments={(enrollments ?? []) as EnrollmentWithCourse[]}
        visits={(visits ?? []) as TreatmentLog[]}
        invoices={(invoices ?? []) as Invoice[]}
      />
    </div>
  );
}
