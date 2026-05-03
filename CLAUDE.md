# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Instructions

## Changelog Requirements
After every code change, append an entry to `CHANGELOG.md`

## Project Tracking
Maintain `PROJECT.md` as the single source of truth for features, active work, backlog, and issues. Keep it updated automatically — do not wait to be asked.

Rules:
- **New requirement from user** → add to the Backlog section as-is (preserve the user's wording)
- **Starting work on a feature** → move from Backlog to Active Work, set status `In Progress`
- **Feature completed** → mark `✅ Done` in Roadmap, remove from Active Work
- **Bug discovered** → add a new row to Issue Log with status `Open`; fill Title, Root Cause (best guess), Date
- **Bug fixed** → update the Issue Log row: status `✅ Resolved`, fill Root Cause (confirmed) and Solution

**Workflow rule:** After making any code change, ask the user to test and confirm before updating the Issue Log to Resolved or before committing and pushing.

## Project Overview

JANGJIN Plus is a bilingual (Thai/English) clinic management web app for JangJin TCM Clinic. It replaces paper treatment logs and Excel invoicing with a centralised system for patient records, course session tracking, treatment history, appointment scheduling, and invoice generation.

The primary user is a solo clinic owner/doctor accessing from both desktop (clinic PC) and mobile (chairside).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js **16.2.4** (App Router) |
| Language | TypeScript (strict mode) |
| UI | shadcn/ui (new-york style) + Tailwind CSS **v4** |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (email + password, httpOnly cookies) |
| ORM | Supabase JS client + generated types (`src/types/supabase.ts`) |
| File Storage | Supabase Storage |
| PDF | `@react-pdf/renderer` (server-side route handler) |
| i18n | `next-intl` v4 (locales: `en` [default], `th`) |
| Forms | React Hook Form + Zod |
| Dates | `date-fns` v4 with Thai locale |
| Hosting | Vercel (frontend) + Supabase (backend/DB) |

> **AGENTS.md warning:** This Next.js version (16.x) has breaking API/convention changes from training data. Read `node_modules/next/dist/docs/` before writing routing, middleware, or server component code.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit (strict TS gate — run before committing)
npx supabase gen types typescript --project-id <id> > src/types/supabase.ts  # Regenerate after schema changes
```

## Architecture

### Route Structure (App Router)

```
src/app/
├── (auth)/          # /login, /reset-password — no nav layout
├── (app)/           # All authenticated routes — sidebar + bottom nav
│   ├── dashboard/
│   ├── patients/[id]/
│   ├── courses/
│   ├── invoices/[id]/
│   └── settings/    # owner role only
└── api/
    └── invoices/[id]/pdf/  # Server-side PDF generation
```

All routes except `/login` and `/reset-password` require authentication (enforced in `src/lib/supabase/middleware.ts`).

### Phased Delivery
- **Phase 1 (MVP):** Auth, Patient CRM, Course Catalog, Enrollment, Check-in/Treatment Log, Invoice PDF, Settings
- **Phase 2:** Appointment scheduling with calendar views
- **Phase 3:** SMS reminders, Revenue Dashboard, Staff role accounts, PDPA consent, CSV export

### i18n
All UI strings must be in `messages/en.json` and `messages/th.json` — no hardcoded display strings in components. Default locale is `en`. Language preference stored in DB (`users.language_preference`). Date format: Thai → `DD/MM/YYYY พ.ศ.`; English → `DD/MM/YYYY CE`. Currency always as `฿X,XXX.XX`.

Namespace structure: `auth.*`, `nav.*`, `patients.*`, `courses.*`, `enrollments.*`, `checkin.*`, `invoices.*`, `settings.*`, `dashboard.*`, `common.*`

### Roles
The `users` table has a `role` enum (`owner` | `staff`) from Phase 1. All API routes enforce role checks. Staff cannot access: revenue dashboard, settings, user management.

### Invoice Numbers
Format: `JJ-YYYY-XXXX` where `YYYY` is the **CE year** (e.g. `JJ-2026-0001`). Sequence resets to `0001` on January 1. Generated atomically via `generate_invoice_number()` Postgres function in `invoice_sequences` table. The `invoice_prefix` is configurable in Settings (default: `JJ`).

### Invoice Clinic Snapshot
When an invoice is created, a JSON snapshot of current clinic settings (name, address, logo URL, tax ID) is stored in `invoices.clinic_snapshot`. Changing settings later must NOT alter historical invoices.

### PDF Generation
Handled server-side in `src/app/api/invoices/[id]/pdf/route.ts` using `@react-pdf/renderer`. Template in `src/lib/pdf/invoice-template.tsx`. Fonts: Sarabun (Thai), Inter (English). Voided invoices get a red "VOID / โมฆะ" diagonal watermark. `doctor_notes` never appear on PDFs.

## Key Business Rules

- **Session deduction is atomic** with treatment log save — use `complete_checkin` Supabase RPC
- **No expiry on sessions** — BR-04
- **Multiple simultaneous enrollments** allowed; doctor must explicitly select which to deduct at check-in — BR-03
- **No-show** does NOT create a treatment log and does NOT deduct a session
- **Invoices are immutable** after creation; corrections require: void original → create new manually
- **Enrollment `total_sessions` is immutable** after creation; add sessions by creating a new enrollment
- **Archived course templates** block new enrollments but do not affect existing active ones
- **`doctor_notes`** must never appear on invoice PDFs or patient-facing views
- When `sessions_used = total_sessions`, enrollment status auto-sets to `completed`
- Duplicate phone numbers trigger a warning (check on blur) but are allowed

## Design Tokens (defined in `src/app/globals.css`)

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#0F4C81` | Buttons, links, headers |
| Secondary | `#2B9EB3` | Accents, active states |
| Success | `#16A34A` | Completed status |
| Warning | `#D97706` | No-show, warnings |
| Danger | `#DC2626` | Void, cancellation |
| Neutral | `#F8FAFC` | Page background |
| Surface | `#FFFFFF` | Cards |

Typography: Thai → Sarabun (Google Fonts, 400/600); English → Inter (Google Fonts, 400/600); base 16px, line-height 1.6.

## UX Patterns

- Check-in flow optimised for one-handed mobile (44×44px min tap targets, single-column)
- Skeleton screens (not spinners) for list/table loading states
- Inline form validation on blur, not only on submit
- Toast notifications (Sonner) for successful actions
- Confirmation dialogs for all destructive actions (void, cancel, delete)
- Patient search debounced at 300ms
