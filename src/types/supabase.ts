// Hand-written types matching supabase/migrations/001_phase1_schema.sql
// Regenerate with: npx supabase gen types typescript --project-id <id> > src/types/supabase.ts

export type Role = "owner" | "staff";
export type Locale = "en" | "th";
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";
export type PatientSource = "facebook" | "walk_in" | "referral" | "other";
export type PaymentMethod = "cash" | "qr_promptpay";
export type EnrollmentStatus = "active" | "completed" | "cancelled";
export type InvoiceType = "course_purchase" | "walk_in" | "manual";
export type InvoiceStatus = "paid" | "void";

export type TreatmentTag =
  | "acupuncture"
  | "cupping"
  | "tui_na"
  | "moxibustion"
  | "herbal_compress"
  | "gua_sha"
  | "herbal_medicine"
  | "electro_acupuncture"
  | "auricular_therapy"
  | "other";

export interface User {
  id: string;
  role: Role;
  language_preference: Locale;
  created_at: string;
}

export interface ClinicSettings {
  id: string;
  clinic_name_th: string | null;
  clinic_name_en: string | null;
  clinic_address_th: string | null;
  clinic_address_en: string | null;
  clinic_phone: string | null;
  clinic_tax_id: string | null;
  clinic_logo_url: string | null;
  clinic_doctor_name: string | null;
  clinic_doctor_name_en: string | null;
  clinic_doctor_license: string | null;
  invoice_prefix: string;
  default_appt_duration_min: number;
  ui_language_default: Locale;
  sms_api_key: string | null;
  sms_sender_name: string | null;
  updated_at: string;
}

export interface Patient {
  id: string;
  full_name: string | null;
  nickname: string | null;
  phone: string | null;
  line_id: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  conditions_allergies: string | null;
  source: PatientSource | null;
  photo_url: string | null;
  patient_number: string | null;
  id_card_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseCatalog {
  id: string;
  name_th: string;
  name_en: string;
  description_th: string | null;
  description_en: string | null;
  total_sessions: number;
  price_thb: number;
  is_active: boolean;
  created_at: string;
}

export interface Enrollment {
  id: string;
  patient_id: string;
  course_id: string;
  total_sessions: number;
  sessions_used: number;
  price_paid_thb: number;
  payment_method: PaymentMethod;
  purchase_date: string;
  status: EnrollmentStatus;
  notes: string | null;
  cancellation_note: string | null;
  created_at: string;
}

export interface EnrollmentWithCourse extends Enrollment {
  course_catalog: CourseCatalog;
}

export interface InvoiceLineItem {
  description_th: string;
  description_en: string;
  quantity: number;
  unit: string;
  unit_price_thb: number;
  total_thb: number;
}

export interface ClinicSnapshot {
  clinic_name_th: string | null;
  clinic_name_en: string | null;
  clinic_address_th: string | null;
  clinic_address_en: string | null;
  clinic_phone: string | null;
  clinic_tax_id: string | null;
  clinic_logo_url: string | null;
  clinic_doctor_name?: string | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  enrollment_id: string | null;
  treatment_log_id: string | null;
  type: InvoiceType;
  line_items: InvoiceLineItem[];
  total_thb: number;
  payment_method: PaymentMethod;
  status: InvoiceStatus;
  void_reason: string | null;
  void_invoice_id: string | null;
  issue_date: string;
  notes: string | null;
  clinic_snapshot: ClinicSnapshot;
  created_at: string;
}

export interface InvoiceWithPatient extends Invoice {
  patients: Pick<Patient, "id" | "full_name" | "phone">;
}

export interface TreatmentLog {
  id: string;
  patient_id: string;
  enrollment_id: string | null;
  visit_date: string;
  treatment_tags: TreatmentTag[];
  treatment_notes: string | null;
  herbs_prescribed: string | null;
  doctor_notes: string | null;
  next_appointment_date: string | null;
  next_appointment_time: string | null;
  walkin_price_thb: number | null;
  appointment_id: string | null;
  created_at: string;
}

// ── Phase 2 ────────────────────────────────────────────────

export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";

export interface Appointment {
  id: string;
  patient_id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  duration_min: number;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithPatient extends Appointment {
  patients: Pick<Patient, "id" | "full_name" | "nickname" | "phone">;
}
