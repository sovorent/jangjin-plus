"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const voidSchema = z.object({
  void_reason: z.string().min(1),
});
type VoidValues = z.infer<typeof voidSchema>;

interface Props {
  open: boolean;
  invoiceNumber: string;
  invoiceId: string;
  onClose: () => void;
  onVoided: (updated: { status: "void"; void_reason: string }) => void;
}

export function VoidInvoiceDialog({ open, invoiceNumber, invoiceId, onClose, onVoided }: Props) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<VoidValues>({ resolver: zodResolver(voidSchema) });

  async function onSubmit(values: VoidValues) {
    const supabase = createClient();
    const { error } = await supabase
      .from("invoices")
      .update({ status: "void", void_reason: values.void_reason })
      .eq("id", invoiceId);

    if (error) {
      toast.error(t("void_error"));
      return;
    }

    toast.success(t("void_success", { number: invoiceNumber }));
    reset();
    onVoided({ status: "void", void_reason: values.void_reason });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("void_title")}</DialogTitle>
          <DialogDescription>{t("void_description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="void_reason">{t("void_reason_label")}</Label>
            <Textarea
              id="void_reason"
              rows={3}
              placeholder={t("void_reason_placeholder")}
              {...register("void_reason")}
            />
            {errors.void_reason && (
              <p className="text-xs text-red-600">{errors.void_reason.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? tCommon("saving") : t("void_confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
