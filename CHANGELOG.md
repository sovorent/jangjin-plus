# Changelog

## [Unreleased] — Phase 1.5 UI Refresh

### Fixed
- **Dropdown/popover z-index inside dialogs** (`select.tsx`, `popover.tsx`, `appointment-form.tsx`): all Select and Popover portals were rendering behind Dialog content because both shared `z-50`. Bumped `SelectContent` and `PopoverContent` to `z-[9999]`; also replaced the appointment date Popover with an inline absolutely-positioned calendar to avoid portal ordering issues.
- **All select dropdowns rendering behind page content** (`simple-select.tsx`, `patient-form.tsx`, `checkin-flow.tsx`, `enroll-dialog.tsx`, `settings-form.tsx`, `appointment-form.tsx`): replaced all Radix UI Select instances with a custom `SimpleSelect` component that uses `ReactDOM.createPortal` + `getBoundingClientRect()` to render a `position: fixed` dropdown directly in `document.body`, escaping all CSS stacking contexts. Background set to `bg-white` (concrete value) because the `bg-popover` CSS variable did not resolve correctly inside the portal, making the dropdown appear transparent/invisible despite being correctly layered on top.
- **PDF patient name & currency rendering** (`invoice-template.tsx`, `route.ts`): patient name now uses Sarabun font (supports Thai characters, fixing garbled/missing name display); ฿ symbol rendered via inline Sarabun `Text` span in Inter context (Inter lacks the Thai Baht glyph); route handler fetches clinic logo from Supabase Storage URL, converts to base64 data-URL, and passes to template; logo rendered at top-right of invoice header above the invoice number block.
- **Web invoice detail logo** (`invoice-detail-client.tsx`): clinic logo from `clinic_snapshot.clinic_logo_url` now displays at top-right of the invoice card header, above the invoice number, mirroring the PDF layout.
- **PDF export 500 error** (`invoice-template.tsx`, `route.ts`, `public/fonts/`): Google Fonts `.woff` CDN URLs returned 404. Fix applied in two phases: (1) downloaded Inter 400/600 and Sarabun 400/600 `.woff` to `public/fonts/`; (2) moved `Font.register()` out of module-top-level (Turbopack timing issue) — `registerFonts()` is now called explicitly inside the route handler, reads font files as `fs.readFileSync()` → base64 `data:font/woff;base64,...` data-URLs, and caches them in process scope. `@react-pdf/renderer` never performs any HTTP fetch.
- **Invoice detail page alignment** (`invoice-detail-client.tsx`, `/invoices/[id]/page.tsx`): replaced shadcn `<Button>/<Badge>/<Separator>` with design-token-native styles; fixed null clinic name showing "—" by falling back to `"JangJin TCM Clinic"`; restructured two-column clinic/invoice-meta header; aligned table headers right for numeric columns; matched total+payment row to design system.
- **Check-in walk-in invoice bug** (`checkin-flow.tsx`): `p_invoice_data` was being passed as `JSON.stringify(object)` — a plain string — which PostgreSQL receives as a JSONB *string scalar*; `p_invoice_data->>'line_items'` then returns NULL, violating the `NOT NULL` constraint on `invoices.line_items`. Fix: pass the plain JS object (no outer `JSON.stringify`); also removed inner `JSON.stringify(lineItems)` and `JSON.stringify(clinicSnapshot)` double-stringification, and changed `total_thb` from `.toString()` to the numeric value.
- **Patient overview alignment** (`overview-tab.tsx`): replaced `flex + w-40` with `grid-cols-[160px_1fr]` CSS grid — labels and values now stay perfectly aligned at all widths; applied design-token border separators between rows
- **Patient profile header** (`patient-profile-client.tsx`): replaced shadcn `<Button>`/`<Tabs>` with design-token-native buttons and a custom underline tab strip; avatar initials, serif name, bilingual sub-label; icon buttons (Edit2, CalendarCheck)
- **Patient detail page** (`/patients/[id]/page.tsx`): removed `max-w-4xl`, added `px-6 py-6 max-w-3xl` + styled back-link using `var(--text-muted)`
- **Check-in page** (`/patients/[id]/checkin/page.tsx`): updated heading to serif font + design-token back-link + bilingual sub-label
- **Courses tab** (`courses-tab.tsx`): replaced shadcn `<Button>`/`<Badge>` with design-token styled button, status badge, and session progress bar
- **Visits tab** (`visits-tab.tsx`): replaced shadcn `<Badge>` with design-token treatment tag chips; applied surface card style

### Added — Phase 2: Appointments
- **DB migration** (`supabase/migrations/002_phase2_appointments.sql`): `appointments` table with `appointment_status` enum, RLS, indexes; activated `treatment_logs.appointment_id` FK; extended `complete_checkin` RPC with `p_appointment_id` (auto-complete linked appointment) and `p_appt_duration_min` (create next appointment record)
- **Types** (`src/types/supabase.ts`): `AppointmentStatus`, `Appointment`, `AppointmentWithPatient`
- **i18n** (`messages/en.json`, `messages/th.json`): `appointments.*` namespace (form, calendar, checkin, status labels)
- **AppointmentCard** (`src/components/appointments/appointment-card.tsx`): status badge, time/date, actions dropdown (edit/cancel/no-show/delete)
- **AppointmentForm** (`src/components/appointments/appointment-form.tsx`): debounced patient search, date popover (react-day-picker), time + duration + notes; create and edit modes
- **AppointmentsTab** (`src/components/appointments/appointments-tab.tsx`): patient profile tab with upcoming/past sections and inline new-appointment dialog
- **AppointmentCalendar** (`src/components/appointments/appointment-calendar.tsx`): month grid with dots on days that have scheduled appointments, day-list panel, new appointment dialog
- **Appointments page** (`src/app/(app)/appointments/page.tsx`): replaced placeholder with live calendar
- **New appointment page** (`src/app/(app)/appointments/new/page.tsx`)
- **Appointment detail page** (`src/app/(app)/appointments/[id]/page.tsx` + `appointment-detail-client.tsx`)
- **Patient profile** (`patients/[id]/page.tsx`, `patient-profile-client.tsx`): added Appointments tab (5th tab); fetches patient appointments + clinic default duration
- **Check-in integration** (`patients/[id]/checkin/page.tsx`, `checkin-flow.tsx`): queries today's scheduled appointment; shows link-to-appointment banner with checkbox; passes `p_appointment_id` to RPC to auto-complete the linked appointment

### Changed
- **Sidebar user footer** (`sidebar.tsx`, `(app)/layout.tsx`): replaced hardcoded "แพทย์จางจิน / owner" with live data — app layout fetches `role` from the `users` table and derives `displayName`/`initials` from Supabase auth metadata (falls back to email prefix); sidebar now accepts these as props and renders them.
- **Login page** (`(auth)/login/page.tsx`, `(auth)/layout.tsx`, `(auth)/reset-password/page.tsx`): reimplemented as split-panel layout — dark navy left branding panel (logo, clinic name, tagline, version footer) and warm cream right form panel with bilingual field labels (Thai primary + English secondary), inline show/hide password toggle ("แสดง"/"ซ่อน"), and full-width navy sign-in button. Auth layout simplified to passthrough; reset-password wraps itself.
- **Design tokens** (`globals.css`): warm parchment palette (`#FAF8F4` bg, `#E8E2D8` border, `#1A1612` text), deep navy sidebar (`#0F1824`), gold accent (`#B8941F`), teal (`#2B9EB3`), full semantic token set with CSS custom properties
- **Fonts** (`layout.tsx`): added `Noto Serif TC` (300/400/600/700) for Chinese-inspired serif headings via `--font-noto-serif-tc`
- **Sidebar** (`sidebar.tsx`): deep navy background, Chinese monogram "張珍" + "Jangjin Plus" branding, bilingual nav labels (Thai primary + English subtext), gold active indicator, user avatar footer
- **Bottom nav** (`bottom-nav.tsx`): deep navy background, gold icon accent for active items, Thai labels
- **Mobile header** (`header.tsx`): deep navy background matching sidebar style
- **App layout**: updated background to warm parchment, full-height overflow handling
- **Nav items** (`nav-items.ts`): added Appointments route, static `labelTH`/`labelEN` bilingual labels
- **Dashboard** (`dashboard/page.tsx`): 4-column stat cards with coloured dots + delta badges, recent invoices list with date/status, decorative monthly revenue bar chart, quick actions panel
- **Patient list** (`patient-list-client.tsx`): avatar initials, bilingual table headers, teal Check-in / ghost Profile action buttons, inline search + filter tabs
- **Courses** (`course-catalog-client.tsx`): card grid layout with colour top-bar, sessions/price stat boxes, archive toggle
- **Invoices** (`invoice-list-client.tsx`): split-view — list sidebar with status badges + detail panel with invoice preview card and VOID watermark
- **Appointments** (`appointments/page.tsx`): Phase 2 placeholder screen
- **Settings** (`settings/page.tsx`): bilingual page header

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
