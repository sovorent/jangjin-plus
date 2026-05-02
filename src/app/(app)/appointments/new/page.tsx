"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Appointment } from "@/types/supabase";
import { AppointmentForm } from "@/components/appointments/appointment-form";

export default function NewAppointmentPage() {
  const t = useTranslations("appointments");
  const tf = useTranslations("appointments.form");
  const router = useRouter();

  function handleSaved(_appt: Appointment) {
    router.push("/appointments");
  }

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
      <h1
        className="text-2xl font-bold mb-6"
        style={{ color: "var(--foreground)" }}
      >
        {tf("title_create")}
      </h1>
      <AppointmentForm onSaved={handleSaved} onCancel={() => router.back()} />
    </div>
  );
}
