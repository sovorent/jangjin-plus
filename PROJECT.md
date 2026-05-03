# JANGJIN Plus — Project Tracker

> **How to use this file**
> - New requirement or idea → add to **Backlog** (free-form, any detail level)
> - Starting work → move item to **Active Work**, mark `In Progress`
> - Done → move to **Roadmap** as `✅ Done`, remove from Active Work
> - Bug found → add row to **Issue Log**, status `Open`
> - Bug fixed → update row: status `Resolved`, fill Root Cause + Solution

---

## Roadmap

### Phase 1 — MVP ✅

| Feature | Status |
|---------|--------|
| Auth — login, reset password | ✅ Done |
| Patient CRM — list, search, create, edit, profile | ✅ Done |
| Course Catalog — create, archive templates | ✅ Done |
| Enrollment — enroll patient, auto-generate invoice | ✅ Done |
| Check-in / Treatment Log — 2-step flow, tags, herbs, doctor notes | ✅ Done |
| Invoice PDF — bilingual, clinic snapshot, void watermark | ✅ Done |
| Settings — clinic info, invoice prefix, default language | ✅ Done |

### Phase 2 — Appointments ✅

| Feature | Status |
|---------|--------|
| DB migration — appointments table, RLS, indexes | ✅ Done |
| Appointment calendar — month grid with day-list panel | ✅ Done |
| Appointment form — create/edit, debounced patient search | ✅ Done |
| Appointment detail page | ✅ Done |
| Patient profile — Appointments tab | ✅ Done |
| Check-in integration — link today's appointment, auto-complete on check-in | ✅ Done |

### Phase 3 — Automation & Growth

| Feature | Status |
|---------|--------|
| SMS appointment reminders | 🔲 Backlog |
| Revenue dashboard | 🔲 Backlog |
| Staff role accounts | 🔲 Backlog |
| PDPA consent management | 🔲 Backlog |
| CSV export | 🔲 Backlog |

---

## Backlog

> Drop new requirements here. No format required — rough notes are fine.

*(empty — add new ideas here)*

---

## Active Work

> What is currently being built. Keep to 5 items max.

*(nothing in progress)*

---

## Issue Log

| # | Title | Status | Root Cause | Solution | Date |
|---|-------|--------|------------|----------|------|
| 1 | PDF patient name garbled — Thai characters missing | ✅ Resolved | `billName` style used Inter font which has no Thai glyphs | Added `fontFamily: "Sarabun"` to `billName` style in `invoice-template.tsx` | 2026-05 |
| 2 | ฿ currency symbol missing in PDF | ✅ Resolved | Inter font lacks the Thai Baht Unicode glyph (U+0E3F) | Wrapped ฿ in an inline `<Text style={{ fontFamily: "Sarabun" }}>` span wherever currency is rendered | 2026-05 |
| 3 | PDF export 500 error — fonts not loading | ✅ Resolved | `Font.register()` used Google Fonts CDN URLs that returned 404; also called at module top-level (Turbopack timing issue) | Downloaded Inter & Sarabun `.woff` to `public/fonts/`; moved `registerFonts()` inside route handler; reads files via `fs.readFileSync` as base64 data-URLs — no HTTP fetch | 2026-05 |
| 4 | Clinic logo not showing on PDF / web invoice | ✅ Resolved | Logo URL not passed to PDF template; web view had no `<img>` in header | Route handler reads `public/logo.png` as base64 data-URL and passes to template; `invoice-detail-client.tsx` renders `<img src="/logo.png">` in header | 2026-05 |
| 5 | Calendar popup rendering behind form fields inside Dialog | ✅ Resolved | Radix Popover portal and Dialog shared conflicting z-index stacking contexts | Replaced Popover date picker with an inline absolutely-positioned `<div>` containing Calendar; click-outside handled manually with `useRef` + `useEffect` | 2026-05 |
| 6 | All select/dropdown menus rendering behind page content | ✅ Resolved | Two combined issues: (1) CSS Grid painting order caused later grid cells to appear above earlier cells' dropdown children; (2) Radix Portal z-index propagation reads `getComputedStyle().zIndex` which returns "auto" for static elements, failing to elevate the wrapper | Replaced all Radix Select with custom `SimpleSelect` using `ReactDOM.createPortal` + `getBoundingClientRect()` → `position: fixed` dropdown rendered in `document.body`; used `bg-white` instead of `bg-popover` (CSS variable did not resolve inside portal, making dropdown transparent) | 2026-05 |
| 7 | Check-in walk-in invoice not saving — line_items NULL | ✅ Resolved | `p_invoice_data` was passed as `JSON.stringify(object)` — a plain string — so PostgreSQL received it as a JSONB string scalar, making `p_invoice_data->>'line_items'` return NULL and violate NOT NULL constraint | Pass plain JS object directly (no `JSON.stringify`); removed inner double-stringification of `lineItems` and `clinicSnapshot`; changed `total_thb` from `.toString()` to numeric value | 2026-05 |
