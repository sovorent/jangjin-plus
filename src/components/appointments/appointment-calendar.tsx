"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { format, isSameDay, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import type { Appointment, AppointmentWithPatient } from "@/types/supabase";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppointmentCard } from "./appointment-card";
import { AppointmentForm } from "./appointment-form";

interface AppointmentCalendarProps {
  initialAppointments: AppointmentWithPatient[];
  defaultDuration: number;
}

export function AppointmentCalendar({ initialAppointments, defaultDuration }: AppointmentCalendarProps) {
  const t = useTranslations("appointments");
  const tf = useTranslations("appointments.form");

  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>(initialAppointments);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [newOpen, setNewOpen] = useState(false);

  // Days that have at least one scheduled appointment (for calendar dots)
  const scheduledDates = appointments
    .filter((a) => a.status === "scheduled")
    .map((a) => parseISO(a.scheduled_date));

  // Appointments for selected day (all statuses)
  const dayAppointments = appointments
    .filter((a) => isSameDay(parseISO(a.scheduled_date), selectedDay))
    .sort((a, b) => (a.scheduled_time ?? "").localeCompare(b.scheduled_time ?? ""));

  function handleUpdated(updated: Appointment) {
    setAppointments((prev) =>
      prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
    );
  }

  function handleDeleted(id: string) {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }

  function handleCreated(appt: Appointment) {
    // Re-fetch is ideal; for now optimistically add with empty patients join
    setAppointments((prev) => [
      { ...appt, patients: { id: appt.patient_id, full_name: null, nickname: null, phone: null } },
      ...prev,
    ]);
    setNewOpen(false);
  }

  return (
    <div className="px-6 py-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            {t("title")}
          </h1>
        </div>
        <button
          onClick={() => setNewOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          <Plus className="w-4 h-4" />
          {t("new_appointment")}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Month calendar */}
        <div
          className="rounded-xl p-4 shrink-0"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <Calendar
            mode="single"
            selected={selectedDay}
            onSelect={(day) => day && setSelectedDay(day)}
            modifiers={{ hasDot: scheduledDates }}
            modifiersClassNames={{ hasDot: "has-appointment-dot" }}
            className="[&_.has-appointment-dot]:relative [&_.has-appointment-dot]:after:absolute [&_.has-appointment-dot]:after:bottom-0.5 [&_.has-appointment-dot]:after:left-1/2 [&_.has-appointment-dot]:after:-translate-x-1/2 [&_.has-appointment-dot]:after:w-1.5 [&_.has-appointment-dot]:after:h-1.5 [&_.has-appointment-dot]:after:rounded-full [&_.has-appointment-dot]:after:bg-[#0F4C81]"
          />
        </div>

        {/* Day list */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>
              {format(selectedDay, "EEEE, d MMMM yyyy")}
            </h2>
            {isSameDay(selectedDay, new Date()) && (
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: "var(--primary-light)", color: "var(--primary)" }}
              >
                {t("calendar.today")}
              </span>
            )}
          </div>

          {dayAppointments.length === 0 ? (
            <div
              className="rounded-xl px-6 py-10 text-center"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {t("no_appointments_day")}
              </p>
              <button
                onClick={() => setNewOpen(true)}
                className="mt-3 text-sm font-medium underline underline-offset-2"
                style={{ color: "var(--primary)" }}
              >
                {t("new_appointment")}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {dayAppointments.map((a) => (
                <AppointmentCard
                  key={a.id}
                  appointment={a}
                  showPatient
                  onUpdated={handleUpdated}
                  onDeleted={handleDeleted}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New appointment dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tf("title_create")}</DialogTitle>
          </DialogHeader>
          <AppointmentForm
            defaultDate={format(selectedDay, "yyyy-MM-dd")}
            defaultDuration={defaultDuration}
            onSaved={handleCreated}
            onCancel={() => setNewOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
