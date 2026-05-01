# Changelog

## [Unreleased] — Phase 1 MVP Implementation

### Added
- **Scaffold fixes**: default locale changed from `th` → `en`; `<html lang>` updated; CLAUDE.md rewritten with correct versions (Next.js 16, React 19, Tailwind 4)
- **Supabase schema** (`supabase/migrations/001_phase1_schema.sql`): tables for `users`, `clinic_settings`, `patients`, `course_catalog`, `enrollments`, `invoices`, `invoice_sequences`, `treatment_logs`; RLS policies; `generate_invoice_number()` and `complete_checkin()` RPCs; indexes
- **TypeScript types** (`src/types/supabase.ts`): hand-written interfaces matching the schema
- **next-intl v4 wiring**: `src/i18n/request.ts`, `next.config.ts` updated with `createNextIntlPlugin`
- **i18n strings**: full `messages/en.json` and `messages/th.json` for all Phase 1 namespaces (`auth`, `nav`, `common`, `dashboard`, `patients`, `courses`, `enrollments`, `checkin`, `invoices`, `settings`)
- **shadcn/ui components** installed: button, input, label, form, dialog, sheet, tabs, table, badge, card, select, checkbox, textarea, popover, calendar, separator, avatar, dropdown-menu, skeleton, sonner
- **Auth pages**: `/login` (email+password, error handling, rate-limit messaging) and `/reset-password` (sends Supabase reset email)
- **App shell**: authenticated layout with desktop sidebar, mobile bottom nav (4 items), and mobile header with logout
- **Settings page** (`/settings`): clinic info, invoice prefix, default language — upserts singleton `clinic_settings` row
- **Course Catalog** (`/courses`): list with active/archived filter, create/edit modal, archive/unarchive with confirmation
- **Patient CRM**:
  - Patient list with 300ms-debounced search (name, nickname, phone) and filter (All / Has Active Course / No Active Course)
  - New patient form with duplicate phone warning on blur
  - Patient profile with 4 tabs: Overview, Courses (with enrollment + cancel), Visits, Invoices
- **Course Enrollment**: enroll dialog with course selector, price override, payment method; auto-creates `course_purchase` invoice via server action using atomic `generate_invoice_number` RPC
- **Treatment Check-in**: 2-step flow — visit type selection (enrollment picker or walk-in) + treatment log (tags, notes, herbs, internal doctor notes, next appointment); session deduction via `complete_checkin` RPC (atomic); enrollment completion toast
- **Invoice management**: global invoice list with paid/void filter; invoice detail with line items, void watermark; void invoice dialog (requires reason); PDF download button
- **PDF generation** (`/api/invoices/[id]/pdf`): server-side A4 portrait PDF via `@react-pdf/renderer`; Inter + Sarabun fonts; red VOID/โมฆะ watermark for voided invoices; `doctor_notes` excluded
- **Dashboard** (`/dashboard`): today's check-ins, invoices, and revenue stats; quick-action buttons; recent patients and invoices lists
- **Root redirect**: `/` now redirects to `/dashboard`
- **`useDebounce` hook** (`src/lib/hooks/use-debounce.ts`)
### Fixed
- TypeScript: Supabase `setAll` cookie callback typed explicitly to satisfy strict mode
- TypeScript: Dashboard invoice partial-select typed with local `DashboardInvoice` interface
- TypeScript: PDF route uses `unknown` cast + `Uint8Array` for `renderToBuffer` compatibility
- Lint: Removed all unused imports and variables across components
- **TCM tag constants** (`src/lib/constants/treatment-tags.ts`)
- **`.env.example`** with Supabase env var placeholders
- **Next.js i18n fix**: added `NextIntlClientProvider` to `src/app/layout.tsx` so `useTranslations()` works in client components
