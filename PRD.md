# JANGJIN Plus — Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** 2026-05-01  
**Clinic:** JangJin Traditional Chinese Medicine Clinic  
**Prepared by:** Product Discovery Interview  
**Status:** Ready for Development

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [Users & Roles](#3-users--roles)
4. [Phased Delivery](#4-phased-delivery)
5. [Functional Requirements](#5-functional-requirements)
   - 5.1 Authentication
   - 5.2 Patient CRM
   - 5.3 Course Catalog
   - 5.4 Course Enrollment
   - 5.5 Treatment Check-in & Log
   - 5.6 Appointment Scheduling
   - 5.7 Invoice Generator
   - 5.8 Revenue Dashboard
   - 5.9 Settings
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Data Models](#7-data-models)
8. [Business Rules](#8-business-rules)
9. [UI/UX Requirements](#9-uiux-requirements)
10. [Tech Stack](#10-tech-stack)
11. [Out of Scope](#11-out-of-scope)
12. [Risks & Mitigations](#12-risks--mitigations)
13. [Glossary](#13-glossary)

---

## 1. Product Overview

### Problem Statement
JangJin TCM Clinic currently operates entirely manually: appointments via Facebook Messenger, treatment notes on paper, and invoices on Excel. This creates data loss risk, no visibility into patient history, significant time overhead, and no professional patient record-keeping.

### Solution
JANGJIN Plus is a cloud-hosted, bilingual (Thai/English) web application that centralises all clinic operations into a single system: patient records, course session tracking, treatment history, appointment scheduling, and invoice generation.

### Primary User
The clinic owner/doctor — operating solo, accessing the app from both desktop (clinic PC) and mobile (chairside during visits).

---

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Eliminate paper treatment logs | % of visits logged digitally | 100% within 1 month of launch |
| Eliminate Excel invoicing | % of invoices generated via app | 100% within 1 month of launch |
| Reduce appointment confirmation time | Time spent on daily reminders | < 5 minutes/day (Phase 2) |
| Accurate session tracking | Zero discrepancies between paid sessions and used sessions | Verified monthly |
| Revenue visibility | Doctor can state monthly revenue in < 10 seconds | Phase 3 dashboard |

---

## 3. Users & Roles

### Phase 1–2: Single User
The Owner/Doctor has full access to all features. No staff login required.

### Phase 3: Role-Based Access

| Role | Permissions |
|------|-------------|
| **owner** | Full CRUD on all entities. Access to revenue dashboard, settings, invoice void. |
| **staff** | Read/write: patients, appointments, check-in, treatment log. Read-only: enrollments, invoices. No access: revenue dashboard, settings, user management. |

**Implementation note:** The `role` field must be stored on the `users` table from Phase 1 even if only `owner` is used. All API routes must check role before Phase 3 staff accounts are created, so no breaking changes are needed.

---

## 4. Phased Delivery

### Phase 1 — MVP (Core Operations)
> Goal: Replace paper + Excel entirely.

- [ ] Authentication (login/logout, password reset)
- [ ] Patient CRM (create, view, edit, search)
- [ ] Course Catalog (create, edit, archive)
- [ ] Course Enrollment (enroll patient, auto-invoice)
- [ ] Treatment Check-in & Log
- [ ] Invoice PDF generation & download
- [ ] Basic Settings (clinic branding for invoices)

### Phase 2 — Scheduling
> Goal: Replace Facebook appointment management.

- [ ] Appointment Calendar (week + day view, list view on mobile)
- [ ] Create / edit / cancel appointments
- [ ] Appointment status tracking (Scheduled → Confirmed → Completed / No-show / Cancelled)
- [ ] Tomorrow's Appointment dashboard widget
- [ ] One-tap copy of patient contact for manual LINE/phone reminder

### Phase 3 — Automation & Growth
> Goal: Reduce manual work, support staff.

- [ ] Automated SMS appointment reminders (24h before)
- [ ] Revenue Dashboard (monthly bar chart, today vs last month)
- [ ] Staff role accounts with restricted permissions
- [ ] PDPA consent checkbox on patient registration
- [ ] CSV data export

---

## 5. Functional Requirements

---

### 5.1 Authentication

**REQ-AUTH-01** The system shall support email + password login.  
**REQ-AUTH-02** The system shall issue a session token (JWT or Supabase session) valid for 7 days with silent refresh.  
**REQ-AUTH-03** The system shall provide a password reset flow via email.  
**REQ-AUTH-04** All routes except `/login` and `/reset-password` shall redirect unauthenticated users to `/login`.  
**REQ-AUTH-05** The `users` table shall include a `role` enum field (`owner` | `staff`) from day one.  
**REQ-AUTH-06** Failed login attempts exceeding 5 in 10 minutes shall trigger a 15-minute lockout.

---

### 5.2 Patient CRM

#### 5.2.1 Patient Record

**REQ-CRM-01** A patient record shall contain the following fields:

| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| `id` | Auto | UUID | PK |
| `full_name` | Yes | Text | Max 200 chars |
| `nickname` | No | Text | Max 100 chars |
| `phone` | No | Text | No format enforcement |
| `line_id` | No | Text | Max 100 chars |
| `date_of_birth` | No | Date | |
| `gender` | No | Enum | `male` \| `female` \| `other` \| `prefer_not_to_say` |
| `conditions_allergies` | No | Text (long) | Medical notes, free text |
| `source` | No | Enum | `facebook` \| `walk_in` \| `referral` \| `other` |
| `photo_url` | No | Text | Storage URL |
| `created_at` | Auto | Timestamp | |
| `updated_at` | Auto | Timestamp | |

**REQ-CRM-02** At least one of `full_name` or `phone` must be provided to save a patient record.  
**REQ-CRM-03** If a submitted phone number already exists on another patient, the system shall display a warning: "Phone number already linked to [Patient Name]. Save anyway?" with Confirm / Cancel options. Saving is allowed.

#### 5.2.2 Patient List

**REQ-CRM-04** The patient list shall support real-time search by `full_name`, `nickname`, and `phone`.  
**REQ-CRM-05** The patient list shall support filtering by: All | Has Active Course | No Active Course.  
**REQ-CRM-06** Each row in the patient list shall display: full name, nickname, phone, count of active enrollments, last visit date.  
**REQ-CRM-07** Each row shall expose quick-action buttons: **New Appointment** (Phase 2) and **Check-in**.

#### 5.2.3 Patient Profile Page

**REQ-CRM-08** The patient profile page shall display, in tabbed sections:
- **Overview:** demographic info, edit button
- **Courses:** list of all enrollments (active + completed + cancelled) with session counts
- **Visits:** chronological treatment log
- **Appointments:** upcoming and past appointments (Phase 2)
- **Invoices:** all invoices linked to this patient

---

### 5.3 Course Catalog

**REQ-CAT-01** The course catalog shall be managed exclusively by the `owner` role.

**REQ-CAT-02** A course template shall contain:

| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| `id` | Auto | UUID | PK |
| `name_th` | Yes | Text | Thai name |
| `name_en` | Yes | Text | English name |
| `description_th` | No | Text | |
| `description_en` | No | Text | |
| `total_sessions` | Yes | Integer | Min: 1 |
| `price_thb` | Yes | Decimal | Min: 0, 2 decimal places |
| `is_active` | Yes | Boolean | Default: true |
| `created_at` | Auto | Timestamp | |

**REQ-CAT-03** Archiving a course template (setting `is_active = false`) shall prevent new enrollments from being created against it.  
**REQ-CAT-04** Archiving shall NOT affect existing active enrollments on that template.  
**REQ-CAT-05** Archived templates shall remain visible in enrollment history with an "Archived" badge.  
**REQ-CAT-06** A course template cannot be deleted if any enrollment references it. It can only be archived.

---

### 5.4 Course Enrollment

**REQ-ENR-01** An enrollment is created when a patient purchases a course.

**REQ-ENR-02** An enrollment record shall contain:

| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| `id` | Auto | UUID | PK |
| `patient_id` | Yes | FK → patients | |
| `course_id` | Yes | FK → course_catalog | |
| `total_sessions` | Yes | Integer | Copied from template at creation, immutable |
| `sessions_used` | Yes | Integer | Default: 0 |
| `sessions_remaining` | Computed | Integer | `total_sessions − sessions_used` |
| `price_paid_thb` | Yes | Decimal | Editable at enrollment (can differ from template price) |
| `payment_method` | Yes | Enum | `cash` \| `qr_promptpay` |
| `purchase_date` | Yes | Date | Default: today |
| `status` | Auto | Enum | `active` \| `completed` \| `cancelled` |
| `notes` | No | Text | |
| `created_at` | Auto | Timestamp | |

**REQ-ENR-03** A patient may have multiple simultaneous enrollments in different courses. There is no limit.  
**REQ-ENR-04** When `sessions_used` reaches `total_sessions`, `status` shall automatically change to `completed`.  
**REQ-ENR-05** Sessions never expire. No expiry date field is needed.  
**REQ-ENR-06** An enrollment may be cancelled by the owner with a required cancellation note. Cancellation does not trigger any refund or invoice reversal — the original invoice remains valid.  
**REQ-ENR-07** Upon successful enrollment creation, an invoice shall be automatically generated (see §5.7).  
**REQ-ENR-08** `total_sessions` is immutable after creation. If a doctor wants to add sessions, they must create a new enrollment.

---

### 5.5 Treatment Check-in & Log

#### 5.5.1 Check-in Flow

**REQ-CHK-01** Check-in is initiated from the patient profile or patient list quick-action.

**REQ-CHK-02** The check-in flow shall follow these steps:

```
Step 1 — Select Visit Type
  ├── [Has active enrollment(s)] → Show enrollment selector
  │     └── Doctor picks one enrollment → proceed to Step 2
  └── [No active enrollment] → Only option: Walk-in (Pay Per Visit)
        └── Doctor enters walk-in price → proceed to Step 2

Step 2 — Fill Treatment Log
  └── Submit → decrement sessions (if enrollment) → save log → generate invoice (if walk-in)
```

**REQ-CHK-03** The enrollment selector shall display for each active enrollment: course name (TH/EN), sessions remaining, purchase date. The doctor selects exactly one.  
**REQ-CHK-04** If the doctor selects an enrollment and then changes to walk-in (or vice versa), the selection shall reset cleanly with no side effects until final submission.  
**REQ-CHK-05** Session decrement is atomic with log save — both succeed or both fail.

#### 5.5.2 Treatment Log Fields

**REQ-LOG-01** A treatment log entry shall contain:

| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| `id` | Auto | UUID | PK |
| `patient_id` | Yes | FK → patients | |
| `enrollment_id` | No | FK → enrollments | Null for walk-ins |
| `visit_date` | Yes | Date | Default: today, editable |
| `treatment_tags` | No | Array\<Enum\> | See predefined TCM tag list below |
| `treatment_notes` | No | Text | Free text, supplements tags |
| `herbs_prescribed` | No | Text | Free text |
| `doctor_notes` | No | Text | Internal only, never shown on invoice or patient-facing views |
| `next_appointment_date` | No | Date | |
| `next_appointment_time` | No | Time | |
| `walkin_price_thb` | No | Decimal | Required if walk-in |
| `appointment_id` | No | FK → appointments | Linked if check-in came from an appointment |
| `created_at` | Auto | Timestamp | |

**REQ-LOG-02** Predefined TCM treatment tags (system-managed, not user-editable in Phase 1):

```
acupuncture        (การฝังเข็ม)
cupping            (การครอบแก้ว)
tui_na             (นวดทุยหนา)
moxibustion        (การรมยา)
herbal_compress    (ประคบสมุนไพร)
gua_sha            (การขูดซา)
herbal_medicine    (ยาสมุนไพร)
electro_acupuncture (การฝังเข็มไฟฟ้า)
auricular_therapy  (การรักษาด้วยหูฝัง)
other              (อื่นๆ)
```

**REQ-LOG-03** The doctor may select multiple tags and add free text in `treatment_notes` simultaneously.  
**REQ-LOG-04** `doctor_notes` shall be visually distinct in the UI (e.g., marked "Internal Notes — not visible to patient") and excluded from all PDF outputs.  
**REQ-LOG-05** If `next_appointment_date` is filled and submitted, a pre-filled appointment creation modal shall appear (Phase 2). In Phase 1, the field is saved but no automatic appointment is created.

#### 5.5.3 No-show Handling

**REQ-LOG-06** No-show is recorded on the Appointment record (not the treatment log).  
**REQ-LOG-07** Marking an appointment as No-show shall NOT create a treatment log entry and shall NOT deduct any session.  
**REQ-LOG-08** A No-show badge shall appear on the patient's appointment history.

---

### 5.6 Appointment Scheduling *(Phase 2)*

#### 5.6.1 Appointment Record

**REQ-APT-01** An appointment record shall contain:

| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| `id` | Auto | UUID | PK |
| `patient_id` | Yes | FK → patients | |
| `date` | Yes | Date | |
| `time` | Yes | Time | |
| `duration_minutes` | Yes | Integer | Default from settings (default: 60) |
| `enrollment_id` | No | FK → enrollments | Optional pre-link |
| `status` | Yes | Enum | `scheduled` \| `confirmed` \| `completed` \| `no_show` \| `cancelled` |
| `reminder_sent` | Yes | Boolean | Default: false (Phase 3) |
| `notes` | No | Text | |
| `created_at` | Auto | Timestamp | |

**REQ-APT-02** Time slots are manual — no automated conflict detection is required in Phase 2. The system shall warn if a new appointment overlaps an existing one on the same day, but allow saving.

#### 5.6.2 Calendar View

**REQ-APT-03** Desktop: week view (default) and day view, switchable.  
**REQ-APT-04** Mobile: list view (chronological, grouped by date) as default; day view accessible.  
**REQ-APT-05** Appointments shall be color-coded by status:

| Status | Color |
|--------|-------|
| Scheduled | Blue |
| Confirmed | Teal/Green |
| Completed | Grey |
| No-show | Red |
| Cancelled | Light grey (muted) |

**REQ-APT-06** Clicking an empty time slot opens the Create Appointment modal pre-filled with that date/time.  
**REQ-APT-07** Clicking an existing appointment opens the Appointment Detail panel with options: Edit, Confirm, Mark No-show, Cancel, Check-in (triggers §5.5 flow).

#### 5.6.3 Tomorrow's Appointment Widget

**REQ-APT-08** The dashboard shall display a "Tomorrow" widget listing all appointments for the following calendar day.  
**REQ-APT-09** Each row shall show: patient name, time, course name (if pre-linked), phone number, Line ID.  
**REQ-APT-10** A **Copy Contact** button shall copy the patient's phone or Line ID to clipboard for manual LINE/SMS reminder.

#### 5.6.4 SMS Reminders *(Phase 3)*

**REQ-APT-11** The system shall send an automated SMS 24 hours before each confirmed appointment.  
**REQ-APT-12** SMS content (Thai): `"[ชื่อคลินิก] เตือนนัดหมายของคุณ [ชื่อคนไข้] วันที่ [วันที่] เวลา [เวลา] น. กรุณาติดต่อ [เบอร์คลินิก] หากต้องการเลื่อนนัด"`  
**REQ-APT-13** Each appointment shall have a per-appointment toggle to disable SMS reminder.  
**REQ-APT-14** Provider: Thaibulksms (primary) or Twilio (fallback). API key configured in Settings.

---

### 5.7 Invoice Generator

#### 5.7.1 Invoice Record

**REQ-INV-01** An invoice record shall contain:

| Field | Required | Type | Constraints |
|-------|----------|------|-------------|
| `id` | Auto | UUID | PK |
| `invoice_number` | Auto | Text | Format: `JJ-YYYY-XXXX`, resets yearly |
| `patient_id` | Yes | FK → patients | |
| `enrollment_id` | No | FK → enrollments | Null for walk-in invoices |
| `treatment_log_id` | No | FK → treatment_logs | Null for course purchase invoices |
| `type` | Yes | Enum | `course_purchase` \| `walk_in` \| `manual` |
| `line_items` | Yes | JSON Array | See structure below |
| `total_thb` | Yes | Decimal | |
| `payment_method` | Yes | Enum | `cash` \| `qr_promptpay` |
| `status` | Yes | Enum | `paid` \| `void` |
| `void_reason` | No | Text | Required if status = `void` |
| `void_invoice_id` | No | FK → invoices | Points to replacement invoice if voided |
| `issue_date` | Yes | Date | Default: today |
| `notes` | No | Text | Appears on PDF |
| `created_at` | Auto | Timestamp | |

**REQ-INV-02** `line_items` JSON structure:
```json
[
  {
    "description_th": "โปรแกรมรักษาปวดหลัง",
    "description_en": "Back Pain Treatment Course",
    "quantity": 10,
    "unit": "sessions",
    "unit_price_thb": 350.00,
    "total_thb": 3500.00
  }
]
```

#### 5.7.2 Invoice Number Generation

**REQ-INV-03** Invoice numbers follow the format `JJ-YYYY-XXXX` where `YYYY` is the Thai Buddhist Era year (พ.ศ.) + 543. Example: 2026 CE = 2569 BE → `JJ-2569-0001`.

> **Note to developer:** Confirm with clinic owner whether to use Buddhist Era or Christian Era year. This PRD defaults to Buddhist Era as it is standard for Thai tax documents.

**REQ-INV-04** The sequence `XXXX` resets to `0001` on January 1 of each year.  
**REQ-INV-05** Walk-in invoices use the same `JJ-YYYY-XXXX` sequence as course purchase invoices (no separate prefix).  
**REQ-INV-06** Invoice number generation must be atomic (database sequence or transaction lock) to prevent duplicates under concurrent access.

#### 5.7.3 Automatic Invoice Triggers

**REQ-INV-07** An invoice shall be automatically created when:
- A course enrollment is successfully saved (`type = course_purchase`)
- A walk-in check-in is submitted (`type = walk_in`)

**REQ-INV-08** Invoice status defaults to `paid` on creation (payment is collected in person).

#### 5.7.4 Invoice Immutability & Void

**REQ-INV-09** An issued invoice is immutable. No fields may be edited after creation except `status` and `void_reason`.  
**REQ-INV-10** To correct an invoice, the owner must: (1) void the original with a reason, (2) create a replacement invoice manually.  
**REQ-INV-11** Voiding requires a non-empty `void_reason` field. The void action requires a confirmation dialog: "This cannot be undone. Reason is required."  
**REQ-INV-12** The voided invoice's number is permanently retired. The replacement receives a new sequential number.

#### 5.7.5 PDF Layout

**REQ-INV-13** The PDF shall be A4 portrait, suitable for printing.

**REQ-INV-14** PDF layout sections (top to bottom):

```
┌─────────────────────────────────────────────┐
│  [Clinic Logo]          Invoice #: JJ-2569-0001 │
│  Clinic Name (TH / EN)  Date: DD/MM/YYYY        │
│  Address (TH / EN)                              │
│  Phone | Tax ID                                 │
├─────────────────────────────────────────────┤
│  Patient: [Name]        Phone: [Phone]          │
├─────────────────────────────────────────────┤
│  # │ Description (TH/EN) │ Qty │ Unit Price │ Total │
│  1 │ โปรแกรม...          │ 10  │ 350 THB    │ 3,500 │
├─────────────────────────────────────────────┤
│  Payment Method: Cash / QR PromptPay            │
│                           Total: 3,500 THB      │
├─────────────────────────────────────────────┤
│  Notes: [invoice notes field]                   │
└─────────────────────────────────────────────┘
```

**REQ-INV-15** Voided invoices shall render with a red "VOID / โมฆะ" diagonal watermark across the page.  
**REQ-INV-16** `doctor_notes` from the treatment log shall NOT appear on any invoice PDF.  
**REQ-INV-17** Font: Sarabun for Thai text, Inter for English text.

---

### 5.8 Revenue Dashboard *(Phase 3)*

**REQ-REV-01** The revenue dashboard is accessible to `owner` role only.

**REQ-REV-02** Dashboard widgets:

| Widget | Data Source | Calculation |
|--------|-------------|-------------|
| Today's Revenue | Invoices with `issue_date = today` and `status = paid` | Sum of `total_thb` |
| This Month's Revenue | Invoices this calendar month, `status = paid` | Sum of `total_thb` |
| vs Last Month | Same, previous month | Difference + % change |
| 12-Month Bar Chart | Last 12 complete months + current | Monthly sum of paid invoices |

**REQ-REV-03** All revenue figures exclude voided invoices.  
**REQ-REV-04** Currency display: always in Thai Baht with comma separator (e.g., ฿12,500.00).

---

### 5.9 Settings

**REQ-SET-01** Settings are accessible to `owner` role only.

**REQ-SET-02** The following settings shall be configurable:

| Key | Type | Used In |
|-----|------|---------|
| `clinic_name_th` | Text | Invoices, SMS |
| `clinic_name_en` | Text | Invoices |
| `clinic_address_th` | Text | Invoices |
| `clinic_address_en` | Text | Invoices |
| `clinic_phone` | Text | Invoices, SMS |
| `clinic_tax_id` | Text | Invoices (เลขประจำตัวผู้เสียภาษี) |
| `clinic_logo_url` | Image upload | Invoices |
| `invoice_prefix` | Text | Invoice numbers (default: `JJ`) |
| `default_appt_duration_min` | Integer | Appointment creation default |
| `ui_language_default` | Enum | `th` \| `en` |
| `sms_api_key` | Text (encrypted) | Phase 3 SMS |
| `sms_sender_name` | Text | Phase 3 SMS |

**REQ-SET-03** Changing `clinic_name_th/en`, `clinic_address_th/en`, `clinic_tax_id`, or `clinic_logo_url` shall NOT retroactively modify already-issued invoices. Invoice PDFs are generated from a snapshot of clinic info at the time of creation (store clinic info snapshot on the invoice record itself).

---

## 6. Non-Functional Requirements

### 6.1 Performance
**REQ-NFR-01** Page load time (first contentful paint) shall be under 2 seconds on a 4G mobile connection.  
**REQ-NFR-02** Patient search results shall appear within 300ms of the last keystroke (debounced at 300ms).  
**REQ-NFR-03** PDF generation shall complete within 5 seconds.

### 6.2 Availability
**REQ-NFR-04** Target uptime: 99.5% (Vercel + Supabase free/pro tier SLA).  
**REQ-NFR-05** The app shall display a user-friendly error screen if the backend is unreachable, with a retry button.

### 6.3 Security
**REQ-NFR-06** All data transmitted over HTTPS.  
**REQ-NFR-07** Supabase Row Level Security (RLS) policies shall be enabled on all tables — API queries must not expose other clinics' data (future-proofing for multi-tenant).  
**REQ-NFR-08** Patient health data (`conditions_allergies`, `doctor_notes`) shall not appear in browser URL parameters or error logs.  
**REQ-NFR-09** Session tokens shall be stored in httpOnly cookies, not localStorage.

### 6.4 Compliance
**REQ-NFR-10** *(Phase 3)* A PDPA consent checkbox ("ยินยอมให้จัดเก็บข้อมูลสุขภาพส่วนบุคคล") shall be added to the patient registration form before production launch.

### 6.5 Localisation
**REQ-NFR-11** All UI strings shall be externalised into `th.json` and `en.json` locale files — no hardcoded display strings in components.  
**REQ-NFR-12** The language toggle (TH | EN) shall be persistent in user preferences (stored in DB, not just localStorage).  
**REQ-NFR-13** Date formats: Thai UI → DD/MM/YYYY พ.ศ.; English UI → DD/MM/YYYY CE.  
**REQ-NFR-14** Currency: always display as `฿X,XXX.XX` regardless of UI language.

### 6.6 Accessibility
**REQ-NFR-15** All interactive elements shall be keyboard-navigable.  
**REQ-NFR-16** Colour contrast ratio shall meet WCAG 2.1 AA minimum (4.5:1 for text).

---

## 7. Data Models

### Entity Relationship Overview

```
ClinicSettings (singleton)

Users
  └── role: owner | staff

Patient
  ├── id, full_name, nickname, phone, line_id, dob, gender,
  │   conditions_allergies, source, photo_url
  │
  ├── Enrollments (0..*)
  │     ├── id, patient_id, course_id, total_sessions, sessions_used,
  │     │   price_paid_thb, payment_method, purchase_date, status, notes
  │     └── Invoice (1) [type = course_purchase]
  │
  ├── TreatmentLogs (0..*)
  │     ├── id, patient_id, enrollment_id(nullable), visit_date,
  │     │   treatment_tags[], treatment_notes, herbs_prescribed,
  │     │   doctor_notes, next_appt_date, next_appt_time,
  │     │   walkin_price_thb(nullable), appointment_id(nullable)
  │     └── Invoice (0..1) [type = walk_in, only if walk-in]
  │
  └── Appointments (0..*) [Phase 2]
        └── id, patient_id, date, time, duration_minutes,
            enrollment_id(nullable), status, reminder_sent, notes

CourseCatalog
  └── id, name_th, name_en, description_th, description_en,
      total_sessions, price_thb, is_active

Invoices
  └── id, invoice_number, patient_id, enrollment_id(nullable),
      treatment_log_id(nullable), type, line_items(JSON),
      total_thb, payment_method, status, void_reason,
      void_invoice_id(nullable), issue_date, notes,
      clinic_snapshot(JSON)  ← snapshot of clinic info at issue time
```

### Invoice Clinic Snapshot (JSON)
```json
{
  "clinic_name_th": "คลินิกแพทย์แผนจีนจางจิน",
  "clinic_name_en": "JangJin TCM Clinic",
  "clinic_address_th": "...",
  "clinic_address_en": "...",
  "clinic_phone": "02-XXX-XXXX",
  "clinic_tax_id": "XXXXXXXXXXXXX",
  "clinic_logo_url": "https://..."
}
```

---

## 8. Business Rules

### BR-01: Session Deduction
Sessions are deducted only upon completed check-in submission. No deduction for No-show or Cancelled appointments.

### BR-02: Enrollment Completion
When `sessions_used = total_sessions`, enrollment `status` is set to `completed` automatically by the backend. The frontend shall display a congratulatory/completion notice.

### BR-03: Multiple Active Enrollments
A patient may hold unlimited simultaneous active enrollments. At check-in, the doctor must explicitly select which enrollment to deduct from. The system does not auto-select.

### BR-04: Sessions Never Expire
No expiry date logic is implemented. Sessions remain valid indefinitely.

### BR-05: No Refunds
No refund or session-reversal flow exists in the UI. Cancellation of an enrollment is for record-keeping only and does not alter invoice status.

### BR-06: Invoice Immutability
Invoices cannot be edited post-creation. Corrections require: void original → create new invoice manually.

### BR-07: Invoice Number Yearly Reset
Invoice sequence resets to `0001` on 1 January each year (CE calendar for sequence logic, BE year for display).

### BR-08: Walk-in Pricing
Walk-in visit price is ad-hoc, entered by the doctor at check-in time. There is no catalog reference.

### BR-09: Course Price Override
At enrollment creation, the doctor may set a `price_paid_thb` that differs from the course template's `price_thb`. Both values are stored independently.

### BR-10: Duplicate Phone Warning
Duplicate phone numbers across patients trigger a warning but are allowed (family members may share a number).

### BR-11: Clinic Settings Snapshot on Invoice
When an invoice is created, a JSON snapshot of the current clinic settings (name, address, logo URL, tax ID) is stored on the invoice record. Future changes to clinic settings do not alter historical invoices.

---

## 9. UI/UX Requirements

### 9.1 Layout & Responsiveness
**REQ-UX-01** The app shall be fully responsive. Breakpoints: mobile (< 768px), tablet (768–1024px), desktop (> 1024px).  
**REQ-UX-02** The check-in flow shall be optimised for one-handed mobile use: large tap targets (min 44×44px), single-column layout, minimal scrolling.  
**REQ-UX-03** Invoice and revenue views shall be optimised for desktop (tables, multi-column layout).

### 9.2 Navigation
**REQ-UX-04** Primary navigation (sidebar on desktop, bottom nav on mobile):
- Dashboard / หน้าหลัก
- Patients / คนไข้
- Appointments / นัดหมาย *(Phase 2)*
- Courses / โปรแกรม
- Invoices / ใบเสร็จ
- Settings / ตั้งค่า *(owner only)*

### 9.3 Design Tokens
**REQ-UX-05** Color palette:

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#0F4C81` (deep navy) | Buttons, links, headers |
| Secondary | `#2B9EB3` (teal) | Accents, active states |
| Success | `#16A34A` | Completed status |
| Warning | `#D97706` | No-show, warnings |
| Danger | `#DC2626` | Void, cancellation |
| Neutral | `#F8FAFC` | Page background |
| Surface | `#FFFFFF` | Cards |

**REQ-UX-06** Typography:
- Thai text: Sarabun (Google Fonts), weights 400 and 600
- English text: Inter (Google Fonts), weights 400 and 600
- Base size: 16px; line height: 1.6

### 9.4 Interaction Patterns
**REQ-UX-07** Destructive actions (void invoice, cancel enrollment, delete patient) shall require a confirmation dialog with explicit text describing the consequence.  
**REQ-UX-08** Forms shall show inline validation errors immediately on blur, not only on submit.  
**REQ-UX-09** Loading states shall use skeleton screens, not spinners, for list and table views.  
**REQ-UX-10** Toast notifications shall confirm successful actions (e.g., "Invoice JJ-2569-0001 created").

---

## 10. Tech Stack

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| Framework | Next.js (App Router) | v14+ |
| Language | TypeScript | Strict mode |
| UI Components | shadcn/ui | Latest |
| Styling | Tailwind CSS | v3 |
| Database | PostgreSQL via Supabase | Managed cloud |
| Auth | Supabase Auth | Email + password |
| ORM / Query | Supabase JS client + TypeScript types | Generated via `supabase gen types` |
| File Storage | Supabase Storage | Logo, patient photos |
| PDF Generation | `@react-pdf/renderer` | Client-side rendering |
| i18n | `next-intl` | `th` and `en` locales |
| Form Handling | React Hook Form + Zod | Validation |
| Date Handling | `date-fns` | With Thai locale |
| Hosting — Frontend | Vercel | Auto-deploy from Git |
| Hosting — Backend/DB | Supabase | Free tier → Pro as needed |
| SMS *(Phase 3)* | Thaibulksms API | Primary Thai SMS gateway |

---

## 11. Out of Scope

The following are explicitly excluded from all phases unless a new PRD is written:

- Patient self-booking portal or patient-facing app
- Online payment gateway (Stripe, Omise, etc.)
- Herb / medicine inventory management
- Multi-branch or multi-clinic support
- Accounting software integration (QuickBooks, Xero)
- Video/telemedicine features
- Automated Facebook / LINE message sending

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Doctor skips the app and reverts to paper/Excel | Medium | High | Prioritise mobile-first check-in UX to make it faster than paper |
| Invoice number duplication under race condition | Low | High | Use DB-level sequence with transaction lock |
| Thai PDPA violation | Medium | High | Add consent checkbox in Phase 3 before any marketing use of patient data |
| Supabase free tier limits hit | Low | Medium | Monitor usage; budget ≈ $25/month for Pro tier |
| PDF generation slow on low-end phones | Medium | Medium | Server-side PDF generation as fallback option |
| SMS delivery failure (Phase 3) | Medium | Low | Log all SMS attempts; surface failures in dashboard; no retry storm |

---

## 13. Glossary

| Term | Definition |
|------|-----------|
| **Enrollment** | A patient's purchase of a specific course package, tracking sessions remaining |
| **Course Template** | A reusable clinic-defined package (name, sessions, default price) |
| **Check-in** | The act of recording a patient's visit and deducting a session from an enrollment |
| **Treatment Log** | The clinical record of a single visit (treatments, herbs, notes) |
| **Walk-in** | A visit with no course enrollment; billed at an ad-hoc price |
| **No-show** | A patient who had an appointment but did not attend; no session deducted |
| **Void** | Cancellation of an issued invoice; requires a reason; irreversible |
| **TCM** | Traditional Chinese Medicine |
| **THB** | Thai Baht |
| **BE** | Buddhist Era (พ.ศ.) — Thai calendar system, CE + 543 |
| **PDPA** | Thailand's Personal Data Protection Act (พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล) |
| **PromptPay / QR** | Thailand's national QR payment standard |

---

*PRD v1.0 — Based on SPEC.md v1.0 — JANGJIN Plus — May 2026*
