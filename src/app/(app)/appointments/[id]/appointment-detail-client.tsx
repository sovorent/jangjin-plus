"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Appointment, AppointmentWithPatient } from "@/types/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppointmentCard } from "@/components/appointments/appointment-card";
import { AppointmentForm } from "@/components/appointments/appointment-form";

interface Props {
  appointment: AppointmentWithPatient;
  defaultDuration: number;
}

export function AppointmentDetailClient({ appointment: initial, defaultDuration }: Props) {
  const tf = useTranslations("appointments.form");
  const router = useRouter();
  const [appointment, setAppointment] = useState<AppointmentWithPatient>(initial);
  const [editOpen, setEditOpen] = useState(false);

  function handleUpdated(updated: Appointment) {
    setAppointment((prev) => ({ ...prev, ...updated }));
  }

  function handleDeleted() {
    router.push("/appointments");
  }

  return (
    <>
      <AppointmentCard
        appointment={appointment}
        showPatient
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tf("title_edit")}</DialogTitle>
          </DialogHeader>
          <AppointmentForm
            appointment={appointment}
            defaultDuration={defaultDuration}
            onSaved={(updated) => { handleUpdated(updated); setEditOpen(false); }}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
