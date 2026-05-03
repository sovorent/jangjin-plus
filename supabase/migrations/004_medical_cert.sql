-- Patient fields for medical certificate
ALTER TABLE patients ADD COLUMN IF NOT EXISTS patient_number VARCHAR(50) NULL;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS id_card_number VARCHAR(20) NULL;

-- Clinic settings for medical certificate
ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS clinic_doctor_license VARCHAR(50) NULL;
ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS clinic_doctor_name_en VARCHAR(100) NULL;
