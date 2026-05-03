"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Patient, EnrollmentWithCourse, TreatmentTag, Appointment } from "@/types/supabase";
import { TREATMENT_TAGS, TREATMENT_TAG_LABELS_TH, TREATMENT_TAG_LABELS_EN } from "@/lib/constants/treatment-tags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SimpleSelect } from "@/components/ui/simple-select";
import { Separator } from "@/components/ui/separator";

type VisitType = "enrollment" | "walkin";

const step2Schema = z.object({
  visit_date: z.string().min(1),
  treatment_notes: z.string().optional(),
  herbs_prescribed: z.string().optional(),
  doctor_notes: z.string().optional(),
  next_appointment_date: z.string().optional(),
  next_appointment_time: z.string().optional(),
  walkin_price_thb: z.coerce.number().min(0).optional(),
  payment_method: z.enum(["cash", "qr_promptpay"]).optional(),
});
type Step2Values = z.infer<typeof step2Schema>;

interface Props {
  patient: Patient;
  activeEnrollments: EnrollmentWithCourse[];
  todayAppointment?: Appointment;
}

export function CheckinFlow({ patient, activeEnrollments, todayAppointment }: Props) {
  const t = useTranslations("checkin");
  const tAppt = useTranslations("appointments.checkin");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [visitType, setVisitType] = useState<VisitType>(
    activeEnrollments.length > 0 ? "enrollment" : "walkin"
  );
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentWithCourse | null>(
    activeEnrollments.length === 1 ? activeEnrollments[0] : null
  );
  const [selectedTags, setSelectedTags] = useState<TreatmentTag[]>([]);
  const [linkAppointment, setLinkAppointment] = useState(!!todayAppointment);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      visit_date: format(new Date(), "yyyy-MM-dd"),
      payment_method: "cash",
    },
  });

  function toggleTag(tag: TreatmentTag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function onSubmit(values: Step2Values) {
    const supabase = createClient();

    // Fetch clinic settings for snapshot
    const { data: settings } = await supabase
      .from("clinic_settings")
      .select("*")
      .single();

    const clinicSnapshot = {
      clinic_name_th: settings?.clinic_name_th ?? null,
      clinic_name_en: settings?.clinic_name_en ?? null,
      clinic_address_th: settings?.clinic_address_th ?? null,
      clinic_address_en: settings?.clinic_address_en ?? null,
      clinic_phone: settings?.clinic_phone ?? null,
      clinic_tax_id: settings?.clinic_tax_id ?? null,
      clinic_logo_url: settings?.clinic_logo_url ?? null,
      clinic_doctor_name: settings?.clinic_doctor_name ?? null,
    };

    let invoiceData = null;
    if (visitType === "walkin" && values.walkin_price_thb) {
      const descTH = selectedTags.length > 0
        ? selectedTags.map((tag) => TREATMENT_TAG_LABELS_TH[tag] ?? tag).join(" ")
        : "รักษา Walk-in";
      const descEN = selectedTags.length > 0
        ? selectedTags.map((tag) => TREATMENT_TAG_LABELS_EN[tag] ?? tag).join(", ")
        : "Walk-in Treatment";
      const lineItems = [
        {
          description_th: descTH,
          description_en: descEN,
          quantity: 1,
          unit: "ครั้ง",
          unit_price_thb: values.walkin_price_thb,
          total_thb: values.walkin_price_thb,
        },
      ];
      // Pass a plain object — Supabase JS serialises it as JSON for the JSONB parameter.
      // Do NOT JSON.stringify here: a string value for a JSONB arg becomes a JSON string
      // scalar in Postgres, so p_invoice_data->>'line_items' returns NULL.
      invoiceData = {
        line_items: lineItems,
        total_thb: values.walkin_price_thb,
        payment_method: values.payment_method ?? "cash",
        notes: null,
        clinic_snapshot: clinicSnapshot,
      };
    }

    const { data, error } = await supabase.rpc("complete_checkin", {
      p_patient_id: patient.id,
      p_enrollment_id: visitType === "enrollment" ? selectedEnrollment?.id ?? null : null,
      p_visit_date: values.visit_date || format(new Date(), "yyyy-MM-dd"),
      p_treatment_tags: selectedTags,
      p_treatment_notes: values.treatment_notes ?? null,
      p_herbs_prescribed: values.herbs_prescribed ?? null,
      p_doctor_notes: values.doctor_notes ?? null,
      p_next_appt_date: values.next_appointment_date || null,
      p_next_appt_time: values.next_appointment_time || null,
      p_walkin_price_thb: visitType === "walkin" ? values.walkin_price_thb ?? null : null,
      p_invoice_data: invoiceData,
      p_appointment_id: (linkAppointment && todayAppointment) ? todayAppointment.id : null,
      p_appt_duration_min: null,
    });

    if (error) {
      toast.error(t("error"));
      return;
    }

    const result = data as { treatment_log_id: string; invoice_id: string | null; enrollment_status: string | null };

    if (result.enrollment_status === "completed") {
      toast.success(
        t("completion_notice", { total: selectedEnrollment?.total_sessions ?? 0 }),
        { duration: 5000 }
      );
    } else {
      toast.success(t("success"));
    }

    router.push(`/patients/${patient.id}`);
  }

  // ── Step 1: Visit type selection ──────────────────────────
  if (step === 1) {
    return (
      <div className="space-y-4">
        <h2 className="font-semibold text-gray-700">{t("step1_title")}</h2>

        {activeEnrollments.length > 0 && (
          <div className="space-y-2">
            <button
              type="button"
              className={`w-full text-left rounded-lg border p-4 transition-colors ${
                visitType === "enrollment"
                  ? "border-[#0F4C81] bg-[#0F4C81]/5"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => setVisitType("enrollment")}
            >
              <p className="font-medium text-sm">{t("select_enrollment")}</p>
            </button>

            {visitType === "enrollment" && (
              <div className="space-y-2 pl-4">
                {activeEnrollments.map((enr) => (
                  <button
                    key={enr.id}
                    type="button"
                    className={`w-full text-left rounded-lg border p-3 text-sm transition-colors ${
                      selectedEnrollment?.id === enr.id
                        ? "border-[#0F4C81] bg-[#0F4C81]/5"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedEnrollment(enr)}
                  >
                    <p className="font-medium">{enr.course_catalog.name_en}</p>
                    <p className="text-muted-foreground text-xs">
                      {t("enrollment_card", {
                        name: enr.course_catalog.name_en,
                        remaining: enr.total_sessions - enr.sessions_used,
                      })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          className={`w-full text-left rounded-lg border p-4 transition-colors ${
            visitType === "walkin"
              ? "border-[#0F4C81] bg-[#0F4C81]/5"
              : "hover:bg-gray-50"
          }`}
          onClick={() => {
            setVisitType("walkin");
            setSelectedEnrollment(null);
          }}
        >
          <p className="font-medium text-sm">{t("select_walkin")}</p>
        </button>

        <Button
          className="w-full"
          onClick={() => setStep(2)}
          disabled={visitType === "enrollment" && !selectedEnrollment}
        >
          {tCommon("next")}
        </Button>
      </div>
    );
  }

  // ── Step 2: Treatment log ─────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <h2 className="font-semibold text-gray-700">{t("step2_title")}</h2>

      {visitType === "walkin" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="walkin_price_thb">{t("walkin_price")}</Label>
            <Input
              id="walkin_price_thb"
              type="number"
              step="0.01"
              min={0}
              placeholder={t("walkin_price_placeholder")}
              {...register("walkin_price_thb")}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("payment_method")}</Label>
            <SimpleSelect
              defaultValue="cash"
              onValueChange={(v) => setValue("payment_method", v as "cash" | "qr_promptpay")}
              options={[
                { value: "cash", label: tCommon("cash") },
                { value: "qr_promptpay", label: tCommon("qr_promptpay") },
              ]}
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="visit_date">{t("visit_date")}</Label>
        <Input id="visit_date" type="date" {...register("visit_date")} />
      </div>

      <div className="space-y-2">
        <Label>{t("treatment_tags")}</Label>
        <div className="flex flex-wrap gap-2">
          {TREATMENT_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full border text-sm transition-colors min-h-[44px] ${
                selectedTags.includes(tag)
                  ? "bg-[#0F4C81] text-white border-[#0F4C81]"
                  : "hover:bg-gray-100"
              }`}
            >
              {t(`tags.${tag}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="treatment_notes">{t("treatment_notes")}</Label>
        <Textarea
          id="treatment_notes"
          rows={3}
          placeholder={t("treatment_notes_placeholder")}
          {...register("treatment_notes")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="herbs_prescribed">{t("herbs_prescribed")}</Label>
        <Input
          id="herbs_prescribed"
          placeholder={t("herbs_placeholder")}
          {...register("herbs_prescribed")}
        />
      </div>

      <Separator />

      {/* Doctor notes — visually distinct, internal only */}
      <div className="space-y-1.5 rounded-lg bg-amber-50 border border-amber-200 p-4">
        <Label htmlFor="doctor_notes" className="text-amber-800">
          {t("doctor_notes_label")}
        </Label>
        <Textarea
          id="doctor_notes"
          rows={2}
          placeholder={t("doctor_notes_placeholder")}
          className="bg-white"
          {...register("doctor_notes")}
        />
      </div>

      <Separator />

      {/* Link to today's appointment banner */}
      {todayAppointment && (
        <div
          className="flex items-center justify-between rounded-lg px-4 py-3"
          style={{ background: "var(--primary-light)", border: "1px solid rgba(15,76,129,0.2)" }}
        >
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "var(--primary)" }}>
              {tAppt("link_prompt")}
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
              {todayAppointment.scheduled_time?.slice(0, 5) ?? ""}
              {todayAppointment.notes ? ` · ${todayAppointment.notes}` : ""}
            </p>
          </div>
          <input
            type="checkbox"
            checked={linkAppointment}
            onChange={(e) => setLinkAppointment(e.target.checked)}
            className="w-4 h-4 accent-[#0F4C81]"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="next_appointment_date">{t("next_appointment_date")}</Label>
          <Input id="next_appointment_date" type="date" {...register("next_appointment_date")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="next_appointment_time">{t("next_appointment_time")}</Label>
          <Input id="next_appointment_time" type="time" {...register("next_appointment_time")} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => setStep(1)}>
          {tCommon("back")}
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
