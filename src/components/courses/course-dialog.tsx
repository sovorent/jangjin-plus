"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import type { CourseCatalog } from "@/types/supabase";
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

const courseSchema = z.object({
  name_th: z.string().min(1),
  name_en: z.string().min(1),
  description_th: z.string().optional(),
  description_en: z.string().optional(),
  total_sessions: z.coerce.number().int().min(1),
  price_thb: z.coerce.number().min(0),
});
type CourseValues = z.infer<typeof courseSchema>;

interface CourseDialogProps {
  open: boolean;
  course: CourseCatalog | null;
  onClose: () => void;
  onSaved: (course: CourseCatalog) => void;
}

export function CourseDialog({ open, course, onClose, onSaved }: CourseDialogProps) {
  const t = useTranslations("courses.form");
  const tCommon = useTranslations("common");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CourseValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: { total_sessions: 1, price_thb: 0 },
  });

  useEffect(() => {
    if (open) {
      reset(
        course
          ? {
              name_th: course.name_th,
              name_en: course.name_en,
              description_th: course.description_th ?? "",
              description_en: course.description_en ?? "",
              total_sessions: course.total_sessions,
              price_thb: course.price_thb,
            }
          : { name_th: "", name_en: "", total_sessions: 1, price_thb: 0 }
      );
    }
  }, [open, course, reset]);

  async function onSubmit(values: CourseValues) {
    const supabase = createClient();

    if (course) {
      const { data, error } = await supabase
        .from("course_catalog")
        .update(values)
        .eq("id", course.id)
        .select()
        .single();
      if (!error && data) onSaved(data as CourseCatalog);
    } else {
      const { data, error } = await supabase
        .from("course_catalog")
        .insert(values)
        .select()
        .single();
      if (!error && data) onSaved(data as CourseCatalog);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{course ? t("title_edit") : t("title_create")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name_th">{t("name_th")}</Label>
              <Input id="name_th" {...register("name_th")} />
              {errors.name_th && <p className="text-xs text-red-600">{errors.name_th.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name_en">{t("name_en")}</Label>
              <Input id="name_en" {...register("name_en")} />
              {errors.name_en && <p className="text-xs text-red-600">{errors.name_en.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="description_th">{t("description_th")}</Label>
              <Textarea id="description_th" rows={2} {...register("description_th")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description_en">{t("description_en")}</Label>
              <Textarea id="description_en" rows={2} {...register("description_en")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="total_sessions">{t("total_sessions")}</Label>
              <Input
                id="total_sessions"
                type="number"
                min={1}
                {...register("total_sessions")}
              />
              {errors.total_sessions && (
                <p className="text-xs text-red-600">{errors.total_sessions.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price_thb">{t("price_thb")}</Label>
              <Input
                id="price_thb"
                type="number"
                min={0}
                step="0.01"
                {...register("price_thb")}
              />
              {errors.price_thb && (
                <p className="text-xs text-red-600">{errors.price_thb.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? tCommon("saving") : tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
