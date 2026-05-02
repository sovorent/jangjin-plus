import { createClient } from "@/lib/supabase/server";
import type { AppointmentWithPatient } from "@/types/supabase";
import { AppointmentCalendar } from "@/components/appointments/appointment-calendar";

export default async function AppointmentsPage() {
  const supabase = await createClient();

  const [{ data: appointments }, { data: settings }] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, patients(id, full_name, nickname, phone)")
      .order("scheduled_date")
      .order("scheduled_time"),
    supabase.from("clinic_settings").select("default_appt_duration_min").single(),
  ]);

  return (
    <AppointmentCalendar
      initialAppointments={(appointments ?? []) as AppointmentWithPatient[]}
      defaultDuration={settings?.default_appt_duration_min ?? 60}
    />
  );
}
