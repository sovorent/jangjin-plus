-- Add doctor/practitioner name to clinic settings for invoice header
ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS clinic_doctor_name VARCHAR(100) NULL;
