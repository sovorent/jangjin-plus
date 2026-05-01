# JANGJIN Plus

Bilingual (Thai / English) clinic management app for **JangJin Traditional Chinese Medicine Clinic** — patient CRM, course enrollments, treatment logs, appointments, and invoicing.

See [`PRD.md`](./PRD.md) for the full product spec (v1.0, May 2026).

## Tech stack

- **Next.js** (App Router) + **TypeScript** strict mode
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** — Postgres, Auth, Storage, RLS
- **next-intl** — Thai / English locales
- **React Hook Form** + **Zod** — forms + validation
- **@react-pdf/renderer** — invoice PDFs *(installed in the invoice phase)*
- **date-fns** — dates with Thai locale support
- Hosted on **Vercel** (frontend) + **Supabase** (backend)

See PRD §10 for full versions and rationale.

## Getting started

```bash
# 1. Install deps
npm install

# 2. Configure environment
cp .env.example .env.local
# then edit .env.local with your Supabase credentials

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command           | What it does                       |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Next.js dev server                 |
| `npm run build`   | Production build                   |
| `npm run start`   | Run the production build           |
| `npm run lint`    | ESLint                             |
| `npm run typecheck` | `tsc --noEmit` — strict TS gate  |

## Phased delivery

Per PRD §4:

- **Phase 1 — MVP:** Auth, Patient CRM, Course Catalog, Enrollment, Treatment Check-in, Invoice PDF, Settings
- **Phase 2 — Scheduling:** Appointment calendar + tomorrow widget
- **Phase 3 — Automation & Growth:** SMS reminders, Revenue dashboard, Staff role, PDPA consent, CSV export

## Project structure (planned)

```
src/
├── app/                    # Next.js App Router routes
│   ├── (auth)/             # /login, /reset-password
│   ├── (app)/              # Authenticated routes — dashboard, patients, courses, etc.
│   └── api/                # Route handlers (PDF gen, webhooks)
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   └── ...                 # App-specific components
├── lib/
│   ├── supabase/           # Browser + server clients (@supabase/ssr)
│   ├── pdf/                # Invoice PDF templates
│   └── i18n/               # next-intl config
├── messages/               # th.json, en.json — locale strings
└── types/                  # Shared TS types (incl. Supabase generated)
```

## License

Private — proprietary to JangJin TCM Clinic.
