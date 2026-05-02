"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import type { Appointment, Patient } from "@/types/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppointmentCard } from "./appointment-card";
import { AppointmentForm } from "./appointment-form";

interface AppointmentsTabProps {
  patient: Patient;
  appointments: Appointment[];
  defaultDuration: number;
}

export function AppointmentsTab({ patient, appointments: initial, defaultDuration }: AppointmentsTabProps) {
  const t = useTranslations("appointments");
  const tf = useTranslations("appointments.form");
  const [appointments, setAppointments] = useState<Appointment[]>(initial);
  const [newOpen, setNewOpen] = useState(false);

  function handleUpdated(updated: Appointment) {
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }

  function handleDeleted(id: string) {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }

  function handleCreated(appt: Appointment) {
    setAppointments((prev) =>
      [appt, ...prev].sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date))
    );
    setNewOpen(false);
  }

  const upcoming = appointments.filter((a) => a.status === "scheduled");
  const past = appointments.filter((a) => a.status !== "scheduled");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>
          {t("title")}
        </h3>
        <button
          onClick={() => setNewOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          {t("new_appointment")}
        </button>
      </div>

      {appointments.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
          {t("no_appointments")}
        </p>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-2">
          {upcoming.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              showPatient={false}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Past
          </p>
          {past.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              showPatient={false}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tf("title_create")}</DialogTitle>
          </DialogHeader>
          <AppointmentForm
            defaultPatientId={patient.id}
            defaultPatientName={patient.full_name ?? patient.phone ?? undefined}
            defaultDuration={defaultDuration}
            onSaved={handleCreated}
            onCancel={() => setNewOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
