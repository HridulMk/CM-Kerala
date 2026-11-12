# Setup and Testing

This guide covers local installation, environment configuration, Supabase setup, and practical test cases for the CM Kerala Public Service Portal demonstration project.

## 1. Prerequisites

- Node.js 20.9 or newer.
- npm.
- A Supabase project with Auth, PostgreSQL, and Storage enabled.
- A Groq API key only if testing AI analysis (optional).
- Access to the Supabase SQL Editor and Auth settings to configure the database and email links.

This is a Next.js/TypeScript project, not a Python project. Install application dependencies using npm and the checked-in `package-lock.json`; `requirements.txt` is informational and does not contain Python packages.

## 2. Installation

From the project root:

```sh
npm install
```

For reproducible CI or deployment installation, use:

```sh
npm ci
```

## 3. Environment configuration

Copy `.env.example` to `.env.local` in the project root. Replace the example values with credentials from the intended Supabase project.

| Variable | Required | Configuration |
|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable key (or project anon key, if configured for this project) |
| `NEXT_PUBLIC_SITE_URL` | Yes for auth/invitation links | App origin, e.g. `http://localhost:3000` for local development |
| `SUPABASE_SERVICE_ROLE_KEY` | Officer invitations and public demo officer signup | Supabase service-role/secret key; server-only |
| `ALLOW_PUBLIC_OFFICER_REGISTRATION` | Optional | Set to `true` only to enable officer demo registration in production; leave `false` otherwise |
| `GROQ_API_KEY` | Optional | Groq API key for CMO AI analysis; server-only |
| `GROQ_MODEL` | Optional | Groq model supporting the configured structured output; defaults to `openai/gpt-oss-20b` |

Security rules:

- Never commit `.env.local`.
- Never prefix `SUPABASE_SERVICE_ROLE_KEY` or `GROQ_API_KEY` with `NEXT_PUBLIC_`.
- Do not use the service-role key in browser code.
- Use non-sensitive demo data unless privacy and external-provider requirements have been reviewed.
- Restart the Next.js server after changing environment variables.

## 4. Supabase configuration

### Database scripts

In the Supabase SQL Editor for the intended project, apply scripts in this order:

1. `supabase/schema.sql`
2. `supabase/grievances.sql`
3. `supabase/grievance-workflow.sql`
4. `supabase/cmo-dashboard.sql`
5. `supabase/citizen-portal.sql`

Scripts install profile, grievance, workflow, dashboard, Citizen-feedback tables/columns, functions, grants, RLS policies, indexes, and the private Storage bucket. Running the application does not apply these SQL changes automatically.

### Supabase Auth and email

- Ensure `public` is exposed in the Supabase Data API.
- Enable email confirmations and configure email delivery. For deployment, use an appropriate SMTP provider.
- Set Auth **Site URL** to the correct app origin.
- Add `http://localhost:3000/auth/confirm` for local testing and the deployed `/auth/confirm` URL to Auth **Redirect URLs**.
- Configure the Invite user email template for secure officer registration, for example:

  ```html
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/officer/register">Accept your officer invitation</a>
  ```

- Ensure `NEXT_PUBLIC_SITE_URL` matches the origin used by the invitee and the Supabase Auth configuration.

### Initial CMO Admin

1. Register and verify a Citizen account.
2. Promote that account using the trusted administrator SQL process documented in the root README.
3. Verify that only the intended profile was promoted. Do not expose public admin registration.

## 5. Start and build

Start local development:

```sh
npm run dev
```

Open `http://localhost:3000`. If port 3000 is already occupied, Next.js may select another port; use the port printed in the terminal and align `NEXT_PUBLIC_SITE_URL` and Supabase redirect URLs as needed.

Run static lint validation:

```sh
npm run lint
```

Run TypeScript checks and production build:

```sh
npm run build
```

Serve a completed production build:

```sh
npm run start
```

There are no dedicated automated application test files configured in the project at this time. The test cases below are manual end-to-end checks; `npm run lint` and `npm run build` are the current automated validation commands.

## 6. Manual test cases

Use separate test accounts for each role and non-sensitive demo data. For tests requiring database state or email, use a configured Supabase project.

| ID | Area | Preconditions | Steps | Expected result |
|---|---|---|---|---|
| SET-01 | Public home | App is running | Open `/` in a signed-out browser | Home page loads without redirecting to login; navigation, service content, and footer are visible |
| SET-02 | Home navigation | App is running | Use Sign in, Register, and navigation links | Links reach `/login`, `/register`, or their intended page/section |
| AUTH-01 | Citizen signup | Supabase Auth email is configured | Register at `/register` with valid details | Signup succeeds and directs the user through the configured email-verification flow |
| AUTH-02 | Citizen verification | A signup confirmation email is available | Verify with the configured code/link and sign in | Auth session is established and Citizen reaches `/citizen/dashboard` |
| AUTH-03 | Role routing | Valid accounts exist for Citizen, CMO Admin, and Officer | Sign in to each account | Each account reaches its role-specific dashboard |
| AUTH-04 | Unauthorized route | Sign in as one role | Navigate directly to another role's dashboard | User is redirected to their own role destination or access is denied |
| AUTH-05 | CMO promotion | A verified Citizen profile exists | Promote exactly that profile using the trusted SQL procedure; sign in | Profile has `cmo_admin` role and opens CMO dashboard |
| AUTH-06 | Officer invite | Sign in as CMO Admin; mail and server secrets configured | Invite an officer; open the email link; complete department/password registration | Invitee reaches secure officer registration and obtains a Department Officer profile |
| AUTH-07 | Demo officer signup | Non-production demo configuration and service key available | Register at `/officer/register` with valid department/password | Officer profile is created and role dashboard opens; public flow is disabled in production unless explicitly enabled |
| CIT-01 | Required grievance fields | Sign in as Citizen | Submit without required subject/category/district/details | Browser/server validation prevents submission and displays validation feedback |
| CIT-02 | Valid grievance | Sign in as Citizen | Submit valid details without an attachment | Grievance is saved; unique reference ID is shown; case appears on dashboard |
| CIT-03 | JPG/PDF upload | Citizen account and private bucket are configured | Submit an allowed valid JPG or PDF under 10 MB | Upload and grievance save succeed; authorized Citizen can open the private attachment |
| CIT-04 | Invalid upload | Sign in as Citizen | Attempt unsupported type, invalid file signature, or file over 10 MB | Submission is rejected with a clear error; no grievance is falsely reported as successful |
| CIT-05 | Citizen isolation | Two Citizen accounts and grievances exist | Sign in as Citizen A and search for Citizen B's reference | Citizen B's grievance is not returned or disclosed |
| CIT-06 | Counts and search | Citizen has multiple grievances in different statuses | Compare dashboard counts with owned rows; search for an owned and an unknown reference | Counts match accessible rows; owned reference shows details; unknown reference shows no match |
| CMO-01 | Dashboard overview | Sign in as CMO Admin; grievances exist | Open CMO dashboard | Counts, statistics, case list, filters, and officer controls load |
| CMO-02 | Filter cases | CMO account and cases with different district/category/status exist | Apply district, category, priority, status, and overdue filters individually | List and paging reflect selected filters |
| CMO-03 | Route grievance | Case is in a routable status; Officer profile optionally exists | Route to valid department with note and optionally matching officer | Assignment/status updates and routing event is recorded |
| CMO-04 | Route validation | CMO account | Select an invalid or mismatched officer/department or attempt routing from a closed state | Database rejects the operation and UI reports failure |
| CMO-05 | Internal note and escalation | CMO account; for escalation case is over 7 days old | Add internal remark and eligible escalation | CMO sees events; Citizen and Officer views do not disclose the internal content |
| OFF-01 | Department queue | Officer assigned to a department with routed grievance | Sign in and open department dashboard | Officer sees eligible department cases and not unrelated department cases |
| OFF-02 | Progress with PDF | Officer has assigned active case | Submit progress note with valid PDF under 10 MB | Progress status and event are saved; authorized staff can view the PDF |
| OFF-03 | Department report | Officer has assigned active case | Submit action-taken report | Case changes to report-awaiting-review status and event is visible to authorized users |
| OFF-04 | Department forwarding | Officer has assigned active case | Forward to a different valid department with note | Department assignment/status changes and forwarding history is recorded |
| CMO-06 | Review report | Case has an action report | CMO chooses resolve or request further action and adds a note | Status and review event are updated; Citizen sees public review history |
| CIT-07 | Public workflow history | Citizen owns a case that has workflow events | View its dashboard history | Public routing/progress/report/review events are visible; internal CMO remark/escalation events are absent |
| CIT-08 | Feedback | Citizen owns a resolved grievance | Submit valid feedback, then attempt a second submission | First feedback is saved and displayed; duplicate is rejected |
| AI-01 | AI configuration missing | CMO account; `GROQ_API_KEY` absent | Request analysis | Clear configuration failure is shown; no fake analysis appears |
| AI-02 | AI success | CMO account, key, model, and provider access configured | Analyze a grievance | Valid advisory fields are displayed; suggested category/priority appear in dashboard filtering |
| AI-03 | AI safeguards | Use safe demo complaint with identifying email/phone strings | Request analysis and inspect authorized provider-side test traces if available | Contact values are masked before the provider call; AI does not automatically route or resolve a case |
| DB-01 | Missing schema | Test environment only; schema not installed | Open a database-dependent page | Setup-required/error state identifies missing database setup rather than showing fabricated data |

## 7. Test data and safety

- Use fabricated names, contact information, locations, and complaint details.
- Avoid uploading real government documents or personally identifying information to a demo environment.
- AI test cases send grievance text to Groq. Use synthetic text unless external processing has been explicitly approved.
- Do not test broad officer registration or service-role operations against a production project.
- Do not test row-level security by changing policies in a shared or production database without approval.

## 8. Troubleshooting

| Symptom | Checks |
|---|---|
| `PGRST205` or missing table/schema cache | Apply the ordered SQL scripts to the correct Supabase project; expose `public` in Data API settings; allow the schema cache to reload |
| Signup email does not arrive or callback fails | Check Auth email provider/SMTP, Site URL, redirect allowlist, email template, and `NEXT_PUBLIC_SITE_URL` |
| Officer invitation points to wrong host | Match `NEXT_PUBLIC_SITE_URL`, Auth Site URL, and invite template; restart the app after environment changes |
| Officer invite or demo registration is not configured | Check server-only `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL`; do not move the key to client code |
| Upload is denied | Verify SQL setup, private bucket exists, correct role/ownership/department assignment, file MIME type, file signature, and 10 MB limit |
| AI analysis is unavailable | Check `GROQ_API_KEY`, model support for strict structured output, provider account limits, network access, and CMO role |
| Dashboard shows no accessible cases | Verify profile role/department, grievance assignment, signed-in account, and RLS policy setup |

