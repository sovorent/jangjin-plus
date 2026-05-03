"use server";

import { createClient } from "@/lib/supabase/server";
import type { ClinicSnapshot, InvoiceLineItem } from "@/types/supabase";

interface EnrollParams {
  patientId: string;
  courseId: string;
  totalSessions: number;
  pricePaidThb: number;
  paymentMethod: "cash" | "qr_promptpay";
  purchaseDate: string;
  notes?: string;
  courseNameTh: string;
  courseNameEn: string;
}

export async function createEnrollment(params: EnrollParams) {
  const supabase = await createClient();

  // 1. Fetch clinic settings for invoice snapshot and prefix
  const { data: settings } = await supabase
    .from("clinic_settings")
    .select("*")
    .single();

  const clinicSnapshot: ClinicSnapshot = {
    clinic_name_th: settings?.clinic_name_th ?? null,
    clinic_name_en: settings?.clinic_name_en ?? null,
    clinic_address_th: settings?.clinic_address_th ?? null,
    clinic_address_en: settings?.clinic_address_en ?? null,
    clinic_phone: settings?.clinic_phone ?? null,
    clinic_tax_id: settings?.clinic_tax_id ?? null,
    clinic_logo_url: settings?.clinic_logo_url ?? null,
    clinic_doctor_name: settings?.clinic_doctor_name ?? null,
  };

  const prefix = settings?.invoice_prefix ?? "JJ";

  // 2. Create enrollment
  const { data: enrollment, error: enrollError } = await supabase
    .from("enrollments")
    .insert({
      patient_id: params.patientId,
      course_id: params.courseId,
      total_sessions: params.totalSessions,
      sessions_used: 0,
      price_paid_thb: params.pricePaidThb,
      payment_method: params.paymentMethod,
      purchase_date: params.purchaseDate,
      status: "active",
      notes: params.notes ?? null,
    })
    .select("*, course_catalog(*)")
    .single();

  if (enrollError || !enrollment) {
    return { error: enrollError?.message ?? "Failed to create enrollment" };
  }

  // 3. Generate invoice number (atomic RPC)
  const { data: invoiceNumberData, error: seqError } = await supabase.rpc(
    "generate_invoice_number",
    { prefix }
  );

  if (seqError || !invoiceNumberData) {
    return { error: seqError?.message ?? "Failed to generate invoice number" };
  }

  const lineItems: InvoiceLineItem[] = [
    {
      description_th: params.courseNameTh,
      description_en: params.courseNameEn,
      quantity: params.totalSessions,
      unit: "sessions",
      unit_price_thb: params.pricePaidThb / params.totalSessions,
      total_thb: params.pricePaidThb,
    },
  ];

  // 4. Create invoice
  const { data: invoice, error: invError } = await supabase
    .from("invoices")
    .insert({
      invoice_number: invoiceNumberData as string,
      patient_id: params.patientId,
      enrollment_id: enrollment.id,
      type: "course_purchase",
      line_items: lineItems,
      total_thb: params.pricePaidThb,
      payment_method: params.paymentMethod,
      status: "paid",
      issue_date: params.purchaseDate,
      clinic_snapshot: clinicSnapshot,
    })
    .select()
    .single();

  if (invError) {
    return { error: invError.message };
  }

  return { enrollment, invoice };
}
