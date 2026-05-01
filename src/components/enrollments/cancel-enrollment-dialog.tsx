"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Enrollment } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

const cancelSchema = z.object({
  cancellation_note: z.string().min(1),
});
type CancelValues = z.infer<typeof cancelSchema>;

interface Props {
  enrollment: Enrollment;
  onClose: () => void;
  onCancelled: (updated: Enrollment) => void;
}

export function CancelEnrollmentDialog({ enrollment, onClose, onCancelled }: Props) {
  const t = useTranslations("enrollments");
  const tCommon = useTranslations("common");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CancelValues>({ resolver: zodResolver(cancelSchema) });

  async function onSubmit(values: CancelValues) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("enrollments")
      .update({ status: "cancelled", cancellation_note: values.cancellation_note })
      .eq("id", enrollment.id)
      .select()
      .single();

    if (error) {
      toast.error(t("cancel_error"));
      return;
    }
    toast.success(t("cancel_success"));
    onCancelled(data as Enrollment);
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("cancel_title")}</DialogTitle>
          <DialogDescription>{t("cancel_warning")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cancellation_note">{t("cancel_reason")}</Label>
            <Textarea
              id="cancellation_note"
              rows={3}
              placeholder={t("cancel_reason_placeholder")}
              {...register("cancellation_note")}
            />
            {errors.cancellation_note && (
              <p className="text-xs text-red-600">{errors.cancellation_note.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? tCommon("saving") : t("cancel_confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
