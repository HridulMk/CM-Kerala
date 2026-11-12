# CM Kerala Public Service Portal

A role-based grievance portal built with Next.js, React, TypeScript, and Supabase. Citizens can submit and follow grievances; CMO Admins can review and route cases; Department Officers can investigate and report action taken.

> **Project status:** This repository is a demonstration project, not an official Government of Kerala service. Do not enter real personal, confidential, or sensitive information. Public Department Officer registration is intended for demonstrations and must remain disabled in a real deployment.

See [REQUIREMENTS.md](./REQUIREMENTS.md) for the project's functional requirements.

## Contents

- [Features](#features)
- [Routes and account roles](#routes-and-account-roles)
- [Technology and project structure](#technology-and-project-structure)
- [Prerequisites](#prerequisites)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Supabase setup](#supabase-setup)
- [Authentication and account administration](#authentication-and-account-administration)
- [Grievance lifecycle and data access](#grievance-lifecycle-and-data-access)
- [Commands and validation](#commands-and-validation)
- [Known limitations](#known-limitations)

## Features

### Public home page

- Public landing page at `/` with government-portal styling, responsive navigation, service overview, grievance lifecycle, department information, and footer.
- Navigation and calls to action link to Citizen registration and sign-in.
- The public home page is separate from authenticated dashboards.

### Citizen portal

- Email/password registration with email verification.
- Submit grievances with subject, Citizen-selected category, name, location, Kerala district, detailed description, and optional supporting JPG or PDF.
- Each successfully submitted grievance receives a unique reference ID.
- Dashboard with exact total, pending, and resolved counts, a list of the Citizen's submissions, and reference-number search.
- View the current status, assigned department, grievance details, own attachment, and Citizen-visible workflow history and notes.
- Submit one feedback response for a resolved grievance.

### CMO Admin workspace

- View and page through all grievances.
- Summary metrics for total, pending, resolved, and overdue grievances; a case is overdue after being open for more than seven days.
- Filter by district, AI-suggested category, AI-suggested priority, status, and overdue state.
- Review grievance information and attachments; route a case to a department and optionally a specific officer.
- Add routing notes, private internal remarks, and escalations.
- Review department action-taken reports, resolve a case, or request further action.
- View district, department, category, and priority statistics.
- Invite Department Officers to register through a protected invitation link.
- Request advisory AI analysis using Groq. Analysis can suggest a department, category, priority, summary, and possible duplicate complaints. Staff must review all suggestions; the model does not make case decisions.

### Department Officer workspace

- See grievances assigned to the officer's department and, where specified, to the officer.
- Add investigation progress notes with an optional private PDF attachment.
- Submit an action-taken report to the CMO or forward a grievance to another department.
- View the staff workflow history and documents authorized for the officer's assigned cases.

### Grievance lifecycle

1. A Citizen submits a grievance and receives a reference ID.
2. The CMO reviews the grievance and routes it to a department, optionally with an officer assignment and note.
3. The assigned department investigates and records progress.
4. The department submits an action-taken report or forwards the case.
5. The CMO reviews the report, resolves the grievance, or requests further action.
6. The Citizen can review public updates and submit feedback after resolution.

## Routes and account roles

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Public information and portal home page |
| `/login` | Public | Citizen and staff sign-in |
| `/register` | Public | Citizen registration |
| `/officer/register` | Public/demo or invited officer | Department Officer registration |
| `/citizen/dashboard` | Citizen | Submit and track grievances |
| `/cmo/dashboard` | CMO Admin | Central grievance administration |
| `/cmo/ai-analysis` | CMO Admin | Select a grievance for AI-assisted review |
| `/cmo/ai-analysis/[id]` | CMO Admin | Analyze an individual grievance |
| `/department/dashboard` | Department Officer | Investigate assigned grievances |
| `/auth/confirm` | Auth callback | Verify Supabase confirmation/invitation links |
| `/set-password` | Invited officer | Set the password for an invited account |

Roles are stored in `public.profiles.role` and are not chosen by the public Citizen registration form:

- `citizen`
- `cmo_admin`
- `department_officer`

After sign-in, the database-backed role determines the dashboard destination. CMO Admin accounts are promoted through a trusted administrator process; there is no public CMO Admin registration flow.

## Technology and project structure

- **Application:** Next.js App Router, React, TypeScript
- **Styling:** Tailwind CSS
- **Authentication, database, and file storage:** Supabase Auth, PostgreSQL, and private Supabase Storage
- **AI assistance:** Groq Chat Completions API, called server-side
- **Validation:** Zod

Key folders and files:

| Path | Purpose |
|---|---|
| `app/` | App Router pages, layouts, authentication callbacks, and server actions |
| `app/actions/` | Server-side authentication, grievance workflow, officer invitation, and AI actions |
| `components/auth/` | Sign-in, Citizen registration, officer registration, and password forms |
| `components/grievances/` | Grievance submission/list, workflow controls, and Citizen feedback UI |
| `components/admin/` | CMO officer invitation and AI analysis forms |
| `lib/auth.ts` | Role checks and role-to-dashboard routing |
| `lib/grievances.ts` | Shared departments, districts, categories, and grievance types |
| `lib/grievance-queries.ts` | Server-side grievance and dashboard data access |
| `lib/supabase/` | Supabase browser/server clients and configuration |
| `supabase/` | Ordered SQL setup scripts for profiles, grievances, workflow, CMO features, and Citizen features |
| `public/` | Static assets |
| `package.json` / `package-lock.json` | Node dependencies and reproducible npm installation |

## Prerequisites

- Node.js 20.9 or newer and npm.
- A Supabase project with Auth, the PostgreSQL database, and Storage enabled.
- A Groq API key to use CMO AI analysis (optional for the rest of the portal).

The project is JavaScript/TypeScript, not Python. Installable application dependencies are maintained in `package.json` and locked in `package-lock.json`; `REQUIREMENTS.md` documents functional and runtime requirements.

## Local development

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the values described in [Environment variables](#environment-variables).

3. Configure the Supabase database and authentication as described in [Supabase setup](#supabase-setup).

4. Start the development server:

   ```sh
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

To run a production build locally:

```sh
npm run build
npm run start
```

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable/anon key used by the app |
| `NEXT_PUBLIC_SITE_URL` | Yes for auth links | Canonical app origin, such as `http://localhost:3000` locally or the deployed HTTPS origin |
| `SUPABASE_SERVICE_ROLE_KEY` | For invitations and demo officer signup | Server-only Supabase privileged key |
| `ALLOW_PUBLIC_OFFICER_REGISTRATION` | Optional; defaults to false in production | Enables public officer demo signup only when explicitly set to `true` in production |
| `GROQ_API_KEY` | Optional | Server-only API key for CMO AI analysis |
| `GROQ_MODEL` | Optional | Groq model name; defaults to `openai/gpt-oss-20b` |

Keep `.env.local` out of source control. Never prefix `SUPABASE_SERVICE_ROLE_KEY` or `GROQ_API_KEY` with `NEXT_PUBLIC_`; neither key belongs in browser code. Restart the development server after changing environment variables.

## Supabase setup

Run these scripts in the Supabase SQL Editor, in this order:

1. [`supabase/schema.sql`](./supabase/schema.sql) — creates `public.profiles`, the profile role constraint, owner-focused row-level security, the signup trigger, and backfills profiles for existing Auth users.
2. [`supabase/grievances.sql`](./supabase/grievances.sql) — creates the grievance table, access policies, indexes, and private `grievance-documents` storage bucket.
3. [`supabase/grievance-workflow.sql`](./supabase/grievance-workflow.sql) — creates case history and transactional, role-checked workflow actions, including investigation PDF access.
4. [`supabase/cmo-dashboard.sql`](./supabase/cmo-dashboard.sql) — adds district, AI category/priority, officer assignment, CMO metrics, and related policies.
5. [`supabase/citizen-portal.sql`](./supabase/citizen-portal.sql) — adds Citizen-selected categories, owner-only public workflow history, and one-time feedback for resolved grievances.

Also check the following Supabase project settings:

- Ensure `public` is an exposed schema in the Supabase Data API.
- Enable Supabase Auth email confirmations and configure email delivery. For production, configure an SMTP provider.
- Set Supabase Auth **Site URL** to the app origin.
- Add the deployed `/auth/confirm` URL (and `http://localhost:3000/auth/confirm` for local testing) to Auth **Redirect URLs**.
- For the **Invite user** email template, use a token-hash confirmation link that points to the officer registration route:

  ```html
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/officer/register">Accept your officer invitation</a>
  ```

- Keep `NEXT_PUBLIC_SITE_URL` consistent with the active application origin so confirmation and invitation links return to the correct app.

The SQL scripts are designed to be rerunnable. They have not necessarily been applied to your hosted Supabase project simply by running the app; execute them in the intended Supabase project before using the features.

If the app reports `PGRST205` for a missing profile or grievance table, check that the correct SQL scripts were applied and that `public` is exposed in the Data API. The setup-required page also links to sign-in; it does not install the database schema.

## Authentication and account administration

### Promote the first CMO Admin

1. Register a Citizen account and verify its email.
2. In the Supabase SQL Editor, promote that verified account. Replace the example email with the intended account:

   ```sql
   update public.profiles
   set role = 'cmo_admin'
   where id = (
     select id
     from auth.users
     where email = 'admin@example.com'
   );
   ```

3. Confirm exactly one profile row was updated. Do not create a public admin-registration path.

### Department Officer accounts

- For normal use, a CMO Admin invites officers through the CMO dashboard. The invitation recipient verifies the invitation, chooses a department, and completes registration.
- `/officer/register` also supports demo public registration. This is intentionally a privileged, server-side account creation flow and can grant access to an officer-role queue. Keep it disabled in production unless this is an isolated demo with non-sensitive data.
- Officer invitation and demo registration use `SUPABASE_SERVICE_ROLE_KEY`; this key must stay server-only.

## Grievance lifecycle and data access

- Grievance status and public/staff actions are tracked in PostgreSQL. Reference IDs are generated by the database and are opaque `GRV-...` identifiers.
- Citizen grievance attachments accept JPG or PDF up to 10 MB. Officer investigation attachments accept PDF up to 10 MB. Files are stored in the private `grievance-documents` bucket and accessed through short-lived signed URLs.
- Citizens can read their own grievance and public workflow history. Citizen history excludes CMO internal remarks and escalations.
- CMO Admins can view and manage grievances, including internal remarks and escalation history.
- Department Officers' grievance and document access is scoped to the officer's department and optional individual assignment.
- Citizen feedback is limited to one response per resolved grievance and is protected by database constraints and row-level security.
- Groq receives the complaint text and short excerpts from likely matching complaints for analysis. Email addresses and phone numbers are masked before the request. The generated result is advisory, may be inaccurate, and must be checked by an authorized person.
- Automatic email/SMS notifications, citizen reopening of resolved grievances, and public unauthenticated reference-number lookups are not implemented.

## Commands and validation

| Command | Purpose |
|---|---|
| `npm install` | Install dependencies from the lockfile |
| `npm run dev` | Start the local development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Create the optimized production build and type-check the app |
| `npm run start` | Serve the production build |

