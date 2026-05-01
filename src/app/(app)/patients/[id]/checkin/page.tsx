import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Patient, EnrollmentWithCourse } from "@/types/supabase";
import { CheckinFlow } from "@/components/checkin/checkin-flow";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CheckinPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("checkin");
  const supabase = await createClient();

  const [{ data: patient }, { data: enrollments }] = await Promise.all([
    supabase.from("patients").select("*").eq("id", id).single(),
    supabase
      .from("enrollments")
      .select("*, course_catalog(*)")
      .eq("patient_id", id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
  ]);

  if (!patient) notFound();

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 mb-4">
        <Link
          href={`/patients/${id}`}
          className="text-sm text-muted-foreground hover:text-gray-900 flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          {(patient as Patient).full_name ?? "Patient"}
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">{t("title")}</h1>

      <CheckinFlow
        patient={patient as Patient}
        activeEnrollments={(enrollments ?? []) as EnrollmentWithCourse[]}
      />
    </div>
  );
}
