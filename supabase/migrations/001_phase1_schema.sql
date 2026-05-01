-- ============================================================
-- JANGJIN Plus — Phase 1 Schema
-- PRD v1.0 | CE year invoice numbers
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- USERS (extends Supabase auth.users)
-- Role stored from day 1 per PRD §3
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role                TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'staff')),
  language_preference TEXT NOT NULL DEFAULT 'en'   CHECK (language_preference IN ('th', 'en')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create user row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- CLINIC SETTINGS (singleton row per clinic)
-- REQ-SET-02
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clinic_settings (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name_th              TEXT,
  clinic_name_en              TEXT,
  clinic_address_th           TEXT,
  clinic_address_en           TEXT,
  clinic_phone                TEXT,
  clinic_tax_id               TEXT,
  clinic_logo_url             TEXT,
  invoice_prefix              TEXT NOT NULL DEFAULT 'JJ',
  default_appt_duration_min   INTEGER NOT NULL DEFAULT 60,
  ui_language_default         TEXT NOT NULL DEFAULT 'en' CHECK (ui_language_default IN ('th', 'en')),
  sms_api_key                 TEXT,
  sms_sender_name             TEXT,
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed a single settings row
INSERT INTO public.clinic_settings DEFAULT VALUES
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- PATIENTS
-- REQ-CRM-01 / REQ-CRM-02
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.patients (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name             TEXT,
  nickname              TEXT,
  phone                 TEXT,
  line_id               TEXT,
  date_of_birth         DATE,
  gender                TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  conditions_allergies  TEXT,
  source                TEXT CHECK (source IN ('facebook', 'walk_in', 'referral', 'other')),
  photo_url             TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- At least one of full_name or phone must be non-null (REQ-CRM-02)
  CONSTRAINT patient_identity CHECK (full_name IS NOT NULL OR phone IS NOT NULL)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- COURSE CATALOG
-- REQ-CAT-02
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.course_catalog (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_th         TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  description_th  TEXT,
  description_en  TEXT,
  total_sessions  INTEGER NOT NULL CHECK (total_sessions >= 1),
  price_thb       NUMERIC(10, 2) NOT NULL CHECK (price_thb >= 0),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- ENROLLMENTS
-- REQ-ENR-02
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.enrollments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  course_id         UUID NOT NULL REFERENCES public.course_catalog(id) ON DELETE RESTRICT,
  total_sessions    INTEGER NOT NULL CHECK (total_sessions >= 1),
  sessions_used     INTEGER NOT NULL DEFAULT 0,
  price_paid_thb    NUMERIC(10, 2) NOT NULL CHECK (price_paid_thb >= 0),
  payment_method    TEXT NOT NULL CHECK (payment_method IN ('cash', 'qr_promptpay')),
  purchase_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  notes             TEXT,
  cancellation_note TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sessions_valid CHECK (sessions_used >= 0 AND sessions_used <= total_sessions)
);

-- ────────────────────────────────────────────────────────────
-- INVOICE SEQUENCES (atomic number generation)
-- REQ-INV-04 / REQ-INV-06
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoice_sequences (
  year          INTEGER PRIMARY KEY,
  last_sequence INTEGER NOT NULL DEFAULT 0
);

-- Atomic invoice number generation — CE year
-- Returns e.g. "JJ-2026-0001"
CREATE OR REPLACE FUNCTION public.generate_invoice_number(prefix TEXT DEFAULT 'JJ')
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  current_year INTEGER := EXTRACT(YEAR FROM NOW())::INTEGER;
  next_seq     INTEGER;
BEGIN
  INSERT INTO public.invoice_sequences (year, last_sequence)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE
    SET last_sequence = public.invoice_sequences.last_sequence + 1
  RETURNING last_sequence INTO next_seq;

  RETURN prefix || '-' || current_year || '-' || LPAD(next_seq::TEXT, 4, '0');
END;
$$;

-- ────────────────────────────────────────────────────────────
-- INVOICES
-- REQ-INV-01
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number    TEXT NOT NULL UNIQUE,
  patient_id        UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  enrollment_id     UUID REFERENCES public.enrollments(id) ON DELETE RESTRICT,
  treatment_log_id  UUID, -- FK added after treatment_logs is created
  type              TEXT NOT NULL CHECK (type IN ('course_purchase', 'walk_in', 'manual')),
  line_items        JSONB NOT NULL DEFAULT '[]',
  total_thb         NUMERIC(10, 2) NOT NULL,
  payment_method    TEXT NOT NULL CHECK (payment_method IN ('cash', 'qr_promptpay')),
  status            TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'void')),
  void_reason       TEXT,
  void_invoice_id   UUID REFERENCES public.invoices(id),
  issue_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  notes             TEXT,
  clinic_snapshot   JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- TREATMENT LOGS
-- REQ-LOG-01
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.treatment_logs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id              UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  enrollment_id           UUID REFERENCES public.enrollments(id) ON DELETE RESTRICT,
  visit_date              DATE NOT NULL DEFAULT CURRENT_DATE,
  treatment_tags          TEXT[] NOT NULL DEFAULT '{}',
  treatment_notes         TEXT,
  herbs_prescribed        TEXT,
  doctor_notes            TEXT, -- internal only, never on invoice or patient-facing views
  next_appointment_date   DATE,
  next_appointment_time   TIME,
  walkin_price_thb        NUMERIC(10, 2),
  appointment_id          UUID, -- Phase 2: FK to appointments
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Now add the FK from invoices → treatment_logs
ALTER TABLE public.invoices
  ADD CONSTRAINT fk_invoice_treatment_log
  FOREIGN KEY (treatment_log_id) REFERENCES public.treatment_logs(id) ON DELETE RESTRICT;

-- ────────────────────────────────────────────────────────────
-- ATOMIC CHECK-IN RPC
-- Decrements enrollment sessions + inserts treatment_log in one transaction
-- Returns { treatment_log_id, invoice_id (nullable), enrollment_status }
-- REQ-CHK-05
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.complete_checkin(
  p_patient_id          UUID,
  p_enrollment_id       UUID,         -- NULL for walk-in
  p_visit_date          DATE,
  p_treatment_tags      TEXT[],
  p_treatment_notes     TEXT,
  p_herbs_prescribed    TEXT,
  p_doctor_notes        TEXT,
  p_next_appt_date      DATE,
  p_next_appt_time      TIME,
  p_walkin_price_thb    NUMERIC,      -- NULL for enrollment visit
  p_invoice_data        JSONB         -- NULL for enrollment visit; {line_items, payment_method, notes, clinic_snapshot} for walk-in
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_log_id            UUID;
  v_invoice_id        UUID;
  v_invoice_number    TEXT;
  v_enrollment_status TEXT := NULL;
  v_prefix            TEXT;
BEGIN
  -- 1. Insert treatment log
  INSERT INTO public.treatment_logs (
    patient_id, enrollment_id, visit_date, treatment_tags,
    treatment_notes, herbs_prescribed, doctor_notes,
    next_appointment_date, next_appointment_time, walkin_price_thb
  ) VALUES (
    p_patient_id, p_enrollment_id, p_visit_date, p_treatment_tags,
    p_treatment_notes, p_herbs_prescribed, p_doctor_notes,
    p_next_appt_date, p_next_appt_time, p_walkin_price_thb
  ) RETURNING id INTO v_log_id;

  -- 2. Decrement enrollment sessions (if not walk-in)
  IF p_enrollment_id IS NOT NULL THEN
    UPDATE public.enrollments
    SET sessions_used = sessions_used + 1,
        status = CASE
          WHEN sessions_used + 1 >= total_sessions THEN 'completed'
          ELSE 'active'
        END
    WHERE id = p_enrollment_id
    RETURNING status INTO v_enrollment_status;
  END IF;

  -- 3. Create walk-in invoice (if walk-in)
  IF p_enrollment_id IS NULL AND p_invoice_data IS NOT NULL THEN
    SELECT invoice_prefix INTO v_prefix FROM public.clinic_settings LIMIT 1;
    v_invoice_number := public.generate_invoice_number(COALESCE(v_prefix, 'JJ'));

    INSERT INTO public.invoices (
      invoice_number, patient_id, treatment_log_id, type,
      line_items, total_thb, payment_method, status, notes, clinic_snapshot
    ) VALUES (
      v_invoice_number,
      p_patient_id,
      v_log_id,
      'walk_in',
      (p_invoice_data->>'line_items')::JSONB,
      (p_invoice_data->>'total_thb')::NUMERIC,
      p_invoice_data->>'payment_method',
      'paid',
      p_invoice_data->>'notes',
      (p_invoice_data->>'clinic_snapshot')::JSONB
    ) RETURNING id INTO v_invoice_id;
  END IF;

  RETURN jsonb_build_object(
    'treatment_log_id',   v_log_id,
    'invoice_id',         v_invoice_id,
    'enrollment_status',  v_enrollment_status
  );
END;
$$;

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- All tables: authenticated users only (single-clinic Phase 1)
-- REQ-NFR-07
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_catalog   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_logs   ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users have full access (role enforcement at app layer)
CREATE POLICY "authenticated_all" ON public.users            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.clinic_settings  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.patients         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.course_catalog   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.enrollments      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.invoices         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.invoice_sequences FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.treatment_logs   FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON public.patients (full_name);
CREATE INDEX IF NOT EXISTS idx_patients_phone     ON public.patients (phone);
CREATE INDEX IF NOT EXISTS idx_enrollments_patient ON public.enrollments (patient_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status  ON public.enrollments (status);
CREATE INDEX IF NOT EXISTS idx_treatment_logs_patient ON public.treatment_logs (patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient    ON public.invoices (patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number     ON public.invoices (invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON public.invoices (issue_date);
