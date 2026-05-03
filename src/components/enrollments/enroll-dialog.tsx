"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createEnrollment } from "@/lib/actions/enrollment";
import type { Patient, CourseCatalog, EnrollmentWithCourse } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SimpleSelect } from "@/components/ui/simple-select";

const enrollSchema = z.object({
  course_id: z.string().min(1),
  price_paid_thb: z.coerce.number().min(0),
  payment_method: z.enum(["cash", "qr_promptpay"]),
  purchase_date: z.string().min(1),
  notes: z.string().optional(),
});
type EnrollValues = z.infer<typeof enrollSchema>;

interface Props {
  open: boolean;
  patient: Patient;
  onClose: () => void;
  onEnrolled: (enrollment: EnrollmentWithCourse) => void;
}

export function EnrollDialog({ open, patient, onClose, onEnrolled }: Props) {
  const t = useTranslations("enrollments");
  const tCommon = useTranslations("common");
  const [courses, setCourses] = useState<CourseCatalog[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseCatalog | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EnrollValues>({
    resolver: zodResolver(enrollSchema),
    defaultValues: {
      payment_method: "cash",
      purchase_date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  useEffect(() => {
    if (open) {
      const supabase = createClient();
      supabase
        .from("course_catalog")
        .select("*")
        .eq("is_active", true)
        .order("name_en")
        .then(({ data }) => setCourses((data ?? []) as CourseCatalog[]));
      reset({
        course_id: "",
        price_paid_thb: 0,
        payment_method: "cash",
        purchase_date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCourse(null);
    }
  }, [open, reset]);

  function handleCourseChange(courseId: string) {
    setValue("course_id", courseId);
    const course = courses.find((c) => c.id === courseId) ?? null;
    setSelectedCourse(course);
    if (course) setValue("price_paid_thb", course.price_thb);
  }

  async function onSubmit(values: EnrollValues) {
    if (!selectedCourse) return;
    const result = await createEnrollment({
      patientId: patient.id,
      courseId: values.course_id,
      totalSessions: selectedCourse.total_sessions,
      pricePaidThb: values.price_paid_thb,
      paymentMethod: values.payment_method,
      purchaseDate: values.purchase_date,
      notes: values.notes,
      courseNameTh: selectedCourse.name_th,
      courseNameEn: selectedCourse.name_en,
    });

    if ("error" in result) {
      toast.error(t("enroll_error"));
      return;
    }

    toast.success(t("enroll_success", { number: result.invoice!.invoice_number }));
    onEnrolled(result.enrollment as EnrollmentWithCourse);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("enroll_title")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("select_course")}</Label>
            <SimpleSelect
              onValueChange={handleCourseChange}
              placeholder={t("select_course_placeholder")}
              options={courses.map((c) => ({
                value: c.id,
                label: `${c.name_en} (${c.total_sessions} sessions — ฿${c.price_thb.toLocaleString()})`,
              }))}
            />
            {errors.course_id && <p className="text-xs text-red-600">{errors.course_id.message}</p>}
          </div>

          {selectedCourse && (
            <p className="text-xs text-muted-foreground">
              {t("sessions_note")} ({selectedCourse.total_sessions} sessions)
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="price_paid_thb">{t("price")}</Label>
            <Input
              id="price_paid_thb"
              type="number"
              step="0.01"
              min={0}
              {...register("price_paid_thb")}
            />
            <p className="text-xs text-muted-foreground">{t("price_note")}</p>
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

          <div className="space-y-1.5">
            <Label htmlFor="purchase_date">{t("purchase_date")}</Label>
            <Input id="purchase_date" type="date" {...register("purchase_date")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("notes")}</Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder={t("notes_placeholder")}
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedCourse}>
              {isSubmitting ? tCommon("saving") : t("enroll_button")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
