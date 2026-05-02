import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import type { Patient, EnrollmentWithCourse, Appointment } from "@/types/supabase";
import { CheckinFlow } from "@/components/checkin/checkin-flow";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CheckinPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("checkin");
  const supabase = await createClient();

  const today = format(new Date(), "yyyy-MM-dd");

  const [{ data: patient }, { data: enrollments }, { data: todayAppointment }] = await Promise.all([
    supabase.from("patients").select("*").eq("id", id).single(),
    supabase
      .from("enrollments")
      .select("*, course_catalog(*)")
      .eq("patient_id", id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("*")
      .eq("patient_id", id)
      .eq("status", "scheduled")
      .eq("scheduled_date", today)
      .maybeSingle(),
  ]);

  if (!patient) notFound();

  return (
    <div className="px-6 md:px-8 py-6 max-w-xl">
      {/* Back link */}
      <Link
        href={`/patients/${id}`}
        className="inline-flex items-center gap-1 mb-5 text-[13px] font-thai transition-opacity hover:opacity-70"
        style={{ color: "var(--text-muted)" }}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        {(patient as Patient).full_name ?? "Patient"}
      </Link>

      <div className="mb-6">
        <h1
          className="font-serif text-[22px] font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          {t("title")}
        </h1>
        <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          Check-in · {(patient as Patient).full_name}
        </p>
      </div>

      <CheckinFlow
        patient={patient as Patient}
        activeEnrollments={(enrollments ?? []) as EnrollmentWithCourse[]}
        todayAppointment={(todayAppointment as Appointment | null) ?? undefined}
      />
    </div>
  );
}
