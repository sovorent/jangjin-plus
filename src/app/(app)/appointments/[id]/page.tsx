import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { AppointmentWithPatient } from "@/types/supabase";
import { AppointmentDetailClient } from "./appointment-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AppointmentDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const t = await getTranslations("appointments");

  const [{ data: appointment }, { data: settings }] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, patients(id, full_name, nickname, phone)")
      .eq("id", id)
      .single(),
    supabase.from("clinic_settings").select("default_appt_duration_min").single(),
  ]);

  if (!appointment) notFound();

  return (
    <div className="px-6 py-6 max-w-xl">
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/appointments"
          className="flex items-center gap-1 text-sm hover:opacity-70 transition-opacity"
          style={{ color: "var(--text-muted)" }}
        >
          <ChevronLeft className="w-4 h-4" />
          {t("title")}
        </Link>
      </div>
      <AppointmentDetailClient
        appointment={appointment as AppointmentWithPatient}
        defaultDuration={settings?.default_appt_duration_min ?? 60}
      />
    </div>
  );
}
