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
    <div className="px-6 md:px-8 py-6 max-w-3xl">
      {/* Back link */}
      <Link
        href="/patients"
        className="inline-flex items-center gap-1 mb-5 text-[13px] font-thai transition-opacity hover:opacity-70"
        style={{ color: "var(--text-muted)" }}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        {t("title")}
      </Link>

      <PatientProfileClient
        patient={patient as Patient}
        enrollments={(enrollments ?? []) as EnrollmentWithCourse[]}
        visits={(visits ?? []) as TreatmentLog[]}
        invoices={(invoices ?? []) as Invoice[]}
      />
    </div>
  );
}
