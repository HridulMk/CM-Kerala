# Project Requirements

This document records the functional and operational requirements for the CM Kerala Public Service Portal demonstration project. Installable JavaScript dependencies are specified separately in `package.json` and locked in `package-lock.json`.

## 1. User roles and access

- The application shall support Citizens, CMO Admins, and Department Officers.
- The signed-in user's database-backed profile role shall control authorization and dashboard routing.
- Public Citizen registration shall not allow the user to select an administrative role.
- CMO Admin account promotion shall require a trusted administrator process.
- Department Officer invitations shall support protected invite acceptance, department selection, and password setup.
- Public Department Officer registration may be used for demonstrations only and shall be disabled by default in production.
- Server-only Supabase privileged credentials shall never be exposed to browser code.

## 2. Public home page

- The root URL shall provide a public home page rather than redirecting to sign-in.
- The page shall have responsive government-portal branding, navigation, sign-in and Citizen-registration links, service information, and a footer.
- Public-facing content shall explain Citizen services, the grievance lifecycle, officer/CMO workflows, and supported departments.
- The home page shall not expose private grievance information.

## 3. Citizen registration and authentication

- Citizens shall register with a name, email address, and password.
- Email verification shall be supported through Supabase Auth.
- After successful sign-in, Citizens shall reach the Citizen dashboard.
- After successful sign-in, CMO Admins and Department Officers shall reach their respective dashboards.

## 4. Grievance submission and tracking

- A Citizen shall be able to submit a grievance with subject, category, location, district, detailed description, and optional supporting document.
- District selection shall use Kerala's 14 districts; category shall use the configured Citizen-facing category list.
- Supporting documents shall be JPG or PDF files no larger than 10 MB.
- A successfully submitted grievance shall receive a unique reference ID.
- A Citizen shall be able to view their previous grievances, current status, assigned department, details, and their own attachment.
- The Citizen dashboard shall show total, pending, and resolved grievance counts using database counts rather than just the currently displayed page.
- An authenticated Citizen shall be able to search their own grievances by reference ID. Reference lookup shall not be available as an unauthenticated public endpoint.
- Citizens shall see public workflow history, including relevant CMO and officer notes, but not private CMO remarks or escalation notes.

## 5. CMO Admin workflow

- CMO Admins shall be able to view grievances, inspect attachments, and filter by district, AI category, AI priority, status, and overdue state.
- The dashboard shall show total, pending, resolved, and overdue case metrics; overdue means open for more than seven days.
- CMO Admins shall be able to route a grievance to a department, optionally assign an officer, and include a routing note.
- CMO Admins shall be able to add private internal remarks and escalate eligible delayed cases.
- CMO Admins shall be able to review department action reports, resolve a grievance, or request further action.
- The dashboard shall present district, department, category, and priority summaries.
- CMO Admins shall be able to invite Department Officers using the server-side Supabase service role.

## 6. Department Officer workflow

- Department Officers shall be able to access grievances routed to their department, subject to optional individual officer assignment.
- Officers shall be able to add investigation progress notes and optionally attach a PDF of no more than 10 MB.
- Officers shall be able to submit an action-taken report to the CMO or forward the grievance to another department.
- Officers shall not see private CMO remarks or escalation notes.

## 7. AI-assisted analysis

- CMO Admins may request analysis of a grievance using the server-side Groq API.
- Analysis may suggest a department, category, priority, a short CMO summary, and possible duplicate complaints for human review.
- Contact details such as email addresses and telephone numbers shall be masked before sending text to the provider.
- AI output shall be advisory only; authorized staff shall verify suggestions and make routing and case decisions.
- AI analysis shall require a server-side `GROQ_API_KEY`; the feature shall not expose this key to the browser.

## 8. Resolution feedback and privacy

- Citizens shall be able to submit one feedback response for a grievance after it is resolved.
- Database constraints and row-level security shall enforce ownership, resolution status, and one-response-per-grievance.
- Grievance records, workflow events, and storage objects shall be protected by Supabase row-level and storage policies.
- Citizen-visible history shall exclude internal CMO remarks and escalation events.
- Temporary signed URLs shall be used for private attachments.

## 9. Technology and operations

- The application shall use Next.js App Router, React, TypeScript, Tailwind CSS, and Supabase.
- Zod shall be used for server-side validation of relevant form/action data.
- Node.js 20.9 or newer and npm are required for local development.
- SQL setup scripts shall be applied in order: `schema.sql`, `grievances.sql`, `grievance-workflow.sql`, `cmo-dashboard.sql`, and `citizen-portal.sql`.
- Developers shall be able to run the app with `npm run dev`, run linting with `npm run lint`, and verify a production build with `npm run build`.
- Secrets and local environment values shall be kept in `.env.local` and out of source control.

## 10. Known scope exclusions

- Automatic email and SMS grievance update notifications are not implemented.
- Citizens cannot currently reopen a resolved grievance from the portal.
- Public, unauthenticated reference-number lookups are intentionally not supported.
- The portal is a demonstration project and is not certified or represented as a production Government of Kerala service.

