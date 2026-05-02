"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { Clock, User, FileText, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Appointment, AppointmentStatus, AppointmentWithPatient } from "@/types/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppointmentForm } from "./appointment-form";

const STATUS_STYLE: Record<AppointmentStatus, { bg: string; color: string }> = {
  scheduled: { bg: "var(--primary-light)", color: "var(--primary)" },
  completed: { bg: "var(--success-light)", color: "var(--success)" },
  cancelled: { bg: "var(--danger-light)",  color: "var(--danger)" },
  no_show:   { bg: "var(--border)",        color: "var(--text-muted)" },
};

interface AppointmentCardProps {
  appointment: Appointment | AppointmentWithPatient;
  showPatient?: boolean;
  onUpdated: (updated: Appointment) => void;
  onDeleted?: (id: string) => void;
}

function hasPatient(a: Appointment | AppointmentWithPatient): a is AppointmentWithPatient {
  return "patients" in a && a.patients != null;
}

export function AppointmentCard({
  appointment,
  showPatient = false,
  onUpdated,
  onDeleted,
}: AppointmentCardProps) {
  const t = useTranslations("appointments");
  const tf = useTranslations("appointments.form");
  const [editOpen, setEditOpen] = useState(false);

  const style = STATUS_STYLE[appointment.status];
  const timeLabel = appointment.scheduled_time
    ? appointment.scheduled_time.slice(0, 5)
    : "—";
  const dateLabel = format(parseISO(appointment.scheduled_date), "dd/MM/yyyy");
  const patientName =
    showPatient && hasPatient(appointment)
      ? (appointment.patients.full_name ?? appointment.patients.phone ?? "—")
      : null;

  async function updateStatus(status: AppointmentStatus, confirmMsg: string) {
    if (!confirm(confirmMsg)) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", appointment.id)
      .select()
      .single();
    if (error) { toast.error(tf("save_error")); return; }
    toast.success(status === "cancelled" ? tf("cancel_success") : tf("noshow_success"));
    onUpdated(data as Appointment);
  }

  async function handleDelete() {
    if (!confirm(tf("delete_confirm"))) return;
    const supabase = createClient();
    const { error } = await supabase.from("appointments").delete().eq("id", appointment.id);
    if (error) { toast.error(tf("delete_error")); return; }
    toast.success(tf("delete_success"));
    onDeleted?.(appointment.id);
  }

  return (
    <>
      <div
        className="flex items-start gap-3 rounded-xl px-4 py-3"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Time / date */}
        <div className="flex flex-col items-center pt-0.5 min-w-[52px]">
          <span className="text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>
            {timeLabel}
          </span>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {dateLabel}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          {patientName && (
            <div className="flex items-center gap-1 mb-0.5">
              <User className="w-3 h-3 shrink-0" style={{ color: "var(--text-muted)" }} />
              <span
                className="text-[13px] font-semibold truncate"
                style={{ color: "var(--foreground)" }}
              >
                {patientName}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ background: style.bg, color: style.color }}
            >
              {t(`status_${appointment.status}` as Parameters<typeof t>[0])}
            </span>
            <span
              className="flex items-center gap-1 text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              <Clock className="w-3 h-3" />
              {appointment.duration_min} min
            </span>
          </div>
          {appointment.notes && (
            <div className="flex items-start gap-1 mt-1">
              <FileText className="w-3 h-3 mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />
              <p className="text-[12px] truncate" style={{ color: "var(--text-secondary)" }}>
                {appointment.notes}
              </p>
            </div>
          )}
        </div>

        {/* Action menu (scheduled only) */}
        {appointment.status === "scheduled" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 rounded-md hover:bg-black/5 transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                {tf("title_edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-amber-600 focus:text-amber-600"
                onClick={() => updateStatus("no_show", tf("noshow_confirm"))}
              >
                {t("status_no_show")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => updateStatus("cancelled", tf("cancel_confirm"))}
              >
                {tf("cancel_confirm").replace("?", "").trim()}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Delete button for terminal states */}
        {(appointment.status === "cancelled" || appointment.status === "no_show") &&
          onDeleted && (
            <button
              onClick={handleDelete}
              className="text-[11px] px-2 py-1 rounded hover:bg-red-50 transition-colors"
              style={{ color: "var(--danger)" }}
            >
              {tf("delete_confirm").replace("?", "").trim()}
            </button>
          )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tf("title_edit")}</DialogTitle>
          </DialogHeader>
          <AppointmentForm
            appointment={appointment as Appointment}
            onSaved={(updated) => { onUpdated(updated); setEditOpen(false); }}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
