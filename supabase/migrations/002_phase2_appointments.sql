-- ============================================================
-- JANGJIN Plus — Phase 2 Schema: Appointments
-- ============================================================

-- ── 1. Enum ────────────────────────────────────────────────
CREATE TYPE public.appointment_status AS ENUM (
  'scheduled',
  'completed',
  'cancelled',
  'no_show'
);

-- ── 2. appointments table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id     UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  duration_min   INTEGER NOT NULL DEFAULT 60,
  status         public.appointment_status NOT NULL DEFAULT 'scheduled',
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 3. Activate the Phase 1 placeholder FK ────────────────
ALTER TABLE public.treatment_logs
  ADD CONSTRAINT fk_treatment_log_appointment
  FOREIGN KEY (appointment_id)
  REFERENCES public.appointments(id)
  ON DELETE SET NULL;

-- ── 4. RLS ─────────────────────────────────────────────────
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_all" ON public.appointments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 5. Indexes ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date    ON public.appointments (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status  ON public.appointments (status);

-- ── 6. Replace complete_checkin RPC ───────────────────────
-- New optional tail params (DEFAULT NULL) keep the existing call site unchanged.
-- p_appointment_id    → marks an existing appointment as completed
-- p_appt_duration_min → duration for the newly-created next appointment
CREATE OR REPLACE FUNCTION public.complete_checkin(
  p_patient_id          UUID,
  p_enrollment_id       UUID,
  p_visit_date          DATE,
  p_treatment_tags      TEXT[],
  p_treatment_notes     TEXT,
  p_herbs_prescribed    TEXT,
  p_doctor_notes        TEXT,
  p_next_appt_date      DATE,
  p_next_appt_time      TIME,
  p_walkin_price_thb    NUMERIC,
  p_invoice_data        JSONB,
  p_appointment_id      UUID    DEFAULT NULL,
  p_appt_duration_min   INTEGER DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_log_id             UUID;
  v_invoice_id         UUID;
  v_invoice_number     TEXT;
  v_enrollment_status  TEXT := NULL;
  v_prefix             TEXT;
  v_new_appt_id        UUID;
  v_default_duration   INTEGER;
BEGIN
  -- 1. Mark existing appointment as completed (if provided)
  IF p_appointment_id IS NOT NULL THEN
    UPDATE public.appointments
    SET status = 'completed', updated_at = NOW()
    WHERE id = p_appointment_id;
  END IF;

  -- 2. Create next appointment (if date provided)
  IF p_next_appt_date IS NOT NULL THEN
    SELECT default_appt_duration_min
    INTO v_default_duration
    FROM public.clinic_settings
    LIMIT 1;

    INSERT INTO public.appointments (
      patient_id, scheduled_date, scheduled_time, duration_min, status
    ) VALUES (
      p_patient_id,
      p_next_appt_date,
      p_next_appt_time,
      COALESCE(p_appt_duration_min, v_default_duration, 60),
      'scheduled'
    ) RETURNING id INTO v_new_appt_id;
  END IF;

  -- 3. Insert treatment log
  INSERT INTO public.treatment_logs (
    patient_id, enrollment_id, visit_date, treatment_tags,
    treatment_notes, herbs_prescribed, doctor_notes,
    next_appointment_date, next_appointment_time, walkin_price_thb,
    appointment_id
  ) VALUES (
    p_patient_id, p_enrollment_id, p_visit_date, p_treatment_tags,
    p_treatment_notes, p_herbs_prescribed, p_doctor_notes,
    p_next_appt_date, p_next_appt_time, p_walkin_price_thb,
    COALESCE(p_appointment_id, v_new_appt_id)
  ) RETURNING id INTO v_log_id;

  -- 4. Decrement enrollment sessions (if not walk-in)
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

  -- 5. Create walk-in invoice (if walk-in)
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
    'enrollment_status',  v_enrollment_status,
    'new_appointment_id', v_new_appt_id
  );
END;
$$;
