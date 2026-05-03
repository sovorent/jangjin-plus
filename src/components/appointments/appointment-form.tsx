"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Appointment, AppointmentStatus, Patient } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SimpleSelect } from "@/components/ui/simple-select";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const appointmentSchema = z.object({
  patient_id:     z.string().min(1, "Required"),
  scheduled_date: z.string().min(1, "Required"),
  scheduled_time: z.string().optional(),
  duration_min:   z.coerce.number().int().min(5).max(480).default(60),
  notes:          z.string().optional(),
  status: z
    .enum(["scheduled", "completed", "cancelled", "no_show"])
    .default("scheduled"),
});
type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  appointment?: Appointment;
  defaultPatientId?: string;
  defaultPatientName?: string;
  defaultDate?: string;
  defaultDuration?: number;
  onSaved: (appt: Appointment) => void;
  onCancel: () => void;
}

export function AppointmentForm({
  appointment,
  defaultPatientId,
  defaultPatientName,
  defaultDate,
  defaultDuration = 60,
  onSaved,
  onCancel,
}: AppointmentFormProps) {
  const t = useTranslations("appointments.form");
  const tAppt = useTranslations("appointments");
  const tCommon = useTranslations("common");

  const [patientQuery, setPatientQuery] = useState(
    appointment
      ? ""
      : (defaultPatientName ?? "")
  );
  const [patientSuggestions, setPatientSuggestions] = useState<Pick<Patient, "id" | "full_name" | "phone">[]>([]);
  const [selectedPatientName, setSelectedPatientName] = useState(defaultPatientName ?? "");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
      setCalendarOpen(false);
    }
  }, []);

  useEffect(() => {
    if (calendarOpen) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calendarOpen, handleClickOutside]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id:     appointment?.patient_id ?? defaultPatientId ?? "",
      scheduled_date: appointment?.scheduled_date ?? defaultDate ?? "",
      scheduled_time: appointment?.scheduled_time?.slice(0, 5) ?? "",
      duration_min:   appointment?.duration_min ?? defaultDuration,
      notes:          appointment?.notes ?? "",
      status:         (appointment?.status as AppointmentStatus) ?? "scheduled",
    },
  });

  const scheduledDate = watch("scheduled_date");

  // Pre-fill patient query when editing
  useEffect(() => {
    if (appointment && !patientQuery) {
      setPatientQuery("(current patient)");
    }
  }, [appointment]);

  function handlePatientInput(value: string) {
    setPatientQuery(value);
    setValue("patient_id", "");
    setSelectedPatientName("");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setPatientSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("patients")
        .select("id, full_name, phone")
        .or(`full_name.ilike.%${value}%,phone.ilike.%${value}%`)
        .limit(6);
      setPatientSuggestions((data ?? []) as Pick<Patient, "id" | "full_name" | "phone">[]);
    }, 300);
  }

  function selectPatient(p: Pick<Patient, "id" | "full_name" | "phone">) {
    setValue("patient_id", p.id);
    const name = p.full_name ?? p.phone ?? p.id;
    setSelectedPatientName(name);
    setPatientQuery(name);
    setPatientSuggestions([]);
  }

  async function onSubmit(values: AppointmentFormValues) {
    const supabase = createClient();
    const payload = {
      patient_id:     values.patient_id,
      scheduled_date: values.scheduled_date,
      scheduled_time: values.scheduled_time || null,
      duration_min:   values.duration_min,
      notes:          values.notes || null,
      status:         values.status,
    };

    let data: Appointment | null = null;
    let error: unknown = null;

    if (appointment) {
      const res = await supabase
        .from("appointments")
        .update(payload)
        .eq("id", appointment.id)
        .select()
        .single();
      data = res.data as Appointment;
      error = res.error;
    } else {
      const res = await supabase
        .from("appointments")
        .insert(payload)
        .select()
        .single();
      data = res.data as Appointment;
      error = res.error;
    }

    if (error || !data) { toast.error(t("save_error")); return; }
    toast.success(t("save_success"));
    onSaved(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Patient selector (hidden in edit mode — patient cannot be changed) */}
      {!appointment && (
        <div className="space-y-1.5 relative">
          <Label>{t("patient")}</Label>
          <Input
            value={patientQuery}
            onChange={(e) => handlePatientInput(e.target.value)}
            placeholder={t("patient_placeholder")}
            autoComplete="off"
          />
          <input type="hidden" {...register("patient_id")} />
          {errors.patient_id && (
            <p className="text-xs text-red-600">{errors.patient_id.message}</p>
          )}
          {patientSuggestions.length > 0 && (
            <ul
              className="absolute z-50 w-full mt-1 rounded-lg shadow-lg overflow-hidden"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              {patientSuggestions.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                    onClick={() => selectPatient(p)}
                  >
                    <span className="font-medium">{p.full_name ?? "—"}</span>
                    {p.phone && (
                      <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        {p.phone}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Date */}
      <div className="space-y-1.5 relative">
        <Label>{t("date")}</Label>
        <input type="hidden" {...register("scheduled_date")} />
        <button
          type="button"
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-md border px-3 py-2 text-sm text-left",
            "bg-white border-gray-200 hover:bg-gray-50 transition-colors",
            !scheduledDate && "text-muted-foreground"
          )}
          onClick={() => setCalendarOpen((o) => !o)}
        >
          <CalendarIcon className="h-4 w-4 opacity-50" />
          {scheduledDate
            ? format(new Date(scheduledDate + "T00:00:00"), "dd/MM/yyyy")
            : t("date")}
        </button>
        {calendarOpen && (
          <div ref={calendarRef} className="absolute left-0 top-full mt-1 z-[9999] rounded-md border bg-white shadow-lg">
            <Calendar
              mode="single"
              selected={scheduledDate ? new Date(scheduledDate + "T00:00:00") : undefined}
              onSelect={(day) => {
                setValue("scheduled_date", day ? format(day, "yyyy-MM-dd") : "");
                setCalendarOpen(false);
              }}
              initialFocus
            />
          </div>
        )}
        {errors.scheduled_date && (
          <p className="text-xs text-red-600">{errors.scheduled_date.message}</p>
        )}
      </div>

      {/* Time + Duration */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t("time")}</Label>
          <Input type="time" {...register("scheduled_time")} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("duration_min")}</Label>
          <SimpleSelect
            defaultValue={String(appointment?.duration_min ?? defaultDuration)}
            onValueChange={(v) => setValue("duration_min", Number(v))}
            options={[15, 30, 45, 60, 90, 120].map((m) => ({ value: String(m), label: `${m} min` }))}
          />
        </div>
      </div>

      {/* Status (edit mode only) */}
      {appointment && (
        <div className="space-y-1.5">
          <Label>{t("status")}</Label>
          <SimpleSelect
            defaultValue={appointment.status}
            onValueChange={(v) => setValue("status", v as AppointmentStatus)}
            options={[
              { value: "scheduled", label: tAppt("status_scheduled") },
              { value: "completed", label: tAppt("status_completed") },
              { value: "cancelled", label: tAppt("status_cancelled") },
              { value: "no_show", label: tAppt("status_no_show") },
            ]}
          />
        </div>
      )}

      {/* Notes */}
      <div className="space-y-1.5">
        <Label>{t("notes")}</Label>
        <Textarea
          rows={2}
          placeholder={t("notes_placeholder")}
          {...register("notes")}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? tCommon("saving") : tCommon("save")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
