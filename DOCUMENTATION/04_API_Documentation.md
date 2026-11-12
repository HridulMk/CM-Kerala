# API Documentation

This document describes the application's current API-facing behavior. The project does **not** define a versioned, public REST API for grievance operations. Most form submissions use Next.js Server Actions, whose transport details and generated action identifiers are framework-managed and are not a stable external API contract. Authentication confirmation uses a Next.js Route Handler. Authenticated database RPCs and Supabase Auth/Storage are backend services used by the application.

Examples below are representative payload shapes for understanding and integration planning. They are not a promise that Next.js Server Actions can be called as ordinary REST endpoints using `curl`. Use the portal UI unless a supported external API is deliberately designed and published.

## Conventions

- **Application origin:** local development usually uses `http://localhost:3000`; production uses the deployed HTTPS origin.
- **Authentication:** Server Actions use the Supabase session held in secure request cookies. Do not send a user-supplied role as proof of authorization.
- **Content type:** Form submissions are passed to Server Actions as `FormData`; file uploads use multipart form data through the browser form.
- **Validation:** Server Actions validate parameters on the server. Database constraints, RLS, and role-checked RPCs provide additional enforcement.
- **Errors:** Server Action validation and business failures normally return `{ success: false, message }`. Unhandled data access failures may be thrown and handled by Next.js error boundaries.
- **Dates:** timestamps are ISO-8601 strings from PostgreSQL/Supabase.
- **UUIDs:** internal grievance IDs and profile IDs are UUIDs. Citizen-facing reference IDs are formatted as `GRV-` plus 12 uppercase hexadecimal characters.

## HTTP route handlers and pages

| Method | Path | Access | Parameters | Behavior / response |
|---|---|---|---|---|
| `GET` | `/` | Public | None | Returns the public portal home page (HTML). |
| `GET` | `/login` | Public | Optional login error query handled by the UI | Returns the sign-in page (HTML). |
| `GET` | `/register` | Public | None | Returns the Citizen registration page (HTML). |
| `GET` | `/citizen/dashboard` | Citizen session | Optional query `reference` | Returns the Citizen dashboard. Reference filtering only searches the authenticated user's grievances. |
| `GET` | `/cmo/dashboard` | CMO Admin session | Dashboard filter query parameters | Returns CMO metrics, filtered cases, and administrative controls. |
| `GET` | `/department/dashboard` | Department Officer session | None | Returns the authorized department case queue. |
| `GET` | `/cmo/ai-analysis` | CMO Admin session | None | Returns the AI-analysis case selector. |
| `GET` | `/cmo/ai-analysis/{id}` | CMO Admin session | `id`: grievance UUID in path | Returns the analysis interface for a grievance. |
| `GET` | `/auth/confirm` | Supabase Auth callback | `code` or `token_hash` plus `type`; optional `next` | Exchanges/verifies the Supabase credential, sets session cookies, and redirects to the allowed registration/password/dashboard destination. |

These application pages return HTML and redirects, not JSON API responses.

### Citizen dashboard query parameters

`GET /citizen/dashboard?reference=GRV-0123456789AB`

| Parameter | Type | Rules |
|---|---|---|
| `reference` | string | Optional. Normalized to uppercase and checked against the `GRV-` plus 12 hexadecimal character format. Results remain restricted by the signed-in Citizen's RLS access. |

Invalid references display a validation message. A well-formed reference that is not owned by the current Citizen returns no matching grievance.

### CMO dashboard query parameters

| Parameter | Type | Meaning |
|---|---|---|
| `district` | string | One of the configured Kerala districts; `unspecified` selects cases with no district |
| `category` | string | AI-suggested category; `unclassified` selects cases without a category |
| `priority` | `Low`, `Medium`, `High` | AI-suggested priority; `unclassified` selects cases without a priority |
| `status` | string | One of the configured grievance statuses |
| `overdue` | `true` | Limit results to cases open for more than seven days |
| `page` | integer | 1-based page number; 50 records per page |

Unknown filter values are ignored by page-level validation. CMO access is checked on the server and enforced again through Supabase policies/functions.

## Next.js Server Actions

The following action interfaces are used by the application UI. They are invoked with `FormData`; do not treat their internal Next.js transport as a stable REST endpoint.

### Submit a grievance — `submitGrievance`

- **Method at UI boundary:** Next.js Server Action (form submission; not a published REST method/path)
- **Access:** Signed-in Citizen
- **Form fields:**

| Field | Type | Validation |
|---|---|---|
| `topic` | string | 3–120 characters |
| `citizenName` | string | 2–150 characters |
| `location` | string | 2–300 characters |
| `district` | string | One of the 14 Kerala districts |
| `category` | string | One of the configured Citizen-facing grievance categories |
| `content` | string | 20–5,000 characters |
| `document` | file, optional | JPG/JPEG or PDF; maximum 10 MB; file signature checked |

Representative form values:

```text
topic=Damaged road near public school
citizenName=Example Citizen
location=Ward 4, Example Town
district=Ernakulam
category=Roads and public works
content=The road surface has several deep potholes near the school entrance...
document=<optional JPG or PDF file>
```

Successful result:

```json
{
  "success": true,
  "message": "Your grievance has been submitted successfully.",
  "referenceId": "GRV-0123456789AB"
}
```

Validation, upload, or database failure result:

```json
{
  "success": false,
  "message": "Attach a JPG or PDF document no larger than 10 MB."
}
```

The reference ID is generated by PostgreSQL and returned after the grievance row has been inserted. The application attempts to remove a previously uploaded file if the grievance insert fails.

### Process grievance workflow — `processGrievanceWorkflowAction`

- **Method at UI boundary:** Next.js Server Action
- **Access:** CMO Admin or Department Officer, according to the requested action
- **Common form fields:** `id` (grievance UUID), `action`, optional `note`, `department`, `decision`, `officerId`, and optional `document`.
- `note` is at most 3,000 characters. Action-specific required notes must be at least 3 characters.
- `document` is accepted only for `progress`, and must be a PDF no larger than 10 MB.
- The database checks current status, actor role, department membership, assignment, allowed department, and action-specific rules.

Supported `action` values and requirements:

| `action` | Authorized role | Additional fields | Effect |
|---|---|---|---|
| `route` | CMO Admin | `department` required; optional `officerId`, `note` | Routes an eligible grievance and optionally assigns an officer |
| `progress` | Assigned Department Officer | `note` required; optional PDF `document` | Records investigation progress and sets status to `in_progress` |
| `report` | Assigned Department Officer | `note` required | Submits action-taken report for CMO review |
| `forward` | Assigned Department Officer | `department` and `note` required | Forwards the case to a different department |
| `review` | CMO Admin | `decision` (`resolved` or `in_progress`) and `note` required | Resolves the case or requests further action |
| `remark` | CMO Admin | `note` required | Adds a private internal remark without changing status |
| `escalate` | CMO Admin | `note` required; case must be open over 7 days | Adds a private escalation event without changing status |

Example route form:

```text
id=00000000-0000-4000-8000-000000000001
action=route
department=Public Works Department (PWD)
officerId=
note=Please inspect the reported road damage and provide an update.
```

Example officer progress form (a PDF may be attached in the `document` field):

```text
id=00000000-0000-4000-8000-000000000001
action=progress
note=Site inspection completed; repair estimate is being prepared.
document=<optional PDF file>
```

Example CMO review form:

```text
id=00000000-0000-4000-8000-000000000001
action=review
decision=resolved
note=The action report addresses the reported issue.
```

Successful result:

```json
{
  "success": true,
  "referenceId": "GRV-0123456789AB",
  "message": "Grievance GRV-0123456789AB workflow updated."
}
```

Failure result:

```json
{
  "success": false,
  "message": "Could not save the workflow update: This grievance cannot be routed in its current status."
}
```

Workflow writes are passed to the role-checked PostgreSQL RPC functions described below. They update the grievance and append the event transactionally.

### Submit Citizen resolution feedback — `submitCitizenFeedback`

- **Method at UI boundary:** Next.js Server Action
- **Access:** Signed-in Citizen who owns a resolved grievance
- **Form fields:** `grievanceId` (UUID), `feedback` (3–2,000 characters)
- **Limit:** One feedback response per grievance.

Example:

```text
grievanceId=00000000-0000-4000-8000-000000000001
feedback=The repair was completed and the road is now safe to use.
```

Success:

```json
{
  "success": true,
  "referenceId": "GRV-0123456789AB",
  "message": "Thank you. Your feedback has been recorded."
}
```

Failure examples include a non-owned or unresolved grievance, invalid feedback length, or an existing feedback row.

### Invite a Department Officer — `createOfficer`

- **Method at UI boundary:** Next.js Server Action
- **Access:** CMO Admin only
- **Form fields:** `fullName` (minimum 2 characters), `email` (valid email)
- **Server configuration:** `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_SITE_URL`.
- **Effect:** Sends a Supabase Auth invitation and marks the invited identity for secure Department Officer registration.

Example:

```text
fullName=Example Officer
email=officer@example.test
```

Success:

```json
{
  "success": true,
  "message": "Invitation sent to officer@example.test. The invitee can set their password and select a department from the secure registration link."
}
```

The service-role key is server-only and must never be supplied by the request.

### Analyze a grievance — `analyzeGrievance`

- **Method at UI boundary:** Next.js Server Action
- **Access:** CMO Admin only
- **Form field:** `grievanceId` (UUID)
- **Server configuration:** `GROQ_API_KEY`; optional `GROQ_MODEL`.
- **Effect:** Loads the grievance and recent duplicate candidates, masks email/phone contact details, calls Groq, validates the structured result, and saves the suggested `category` and `priority` to the grievance.

Example input:

```text
grievanceId=00000000-0000-4000-8000-000000000001
```

Representative success response (analysis values are illustrative):

```json
{
  "success": true,
  "message": "AI analysis is ready. Review all suggestions before acting.",
  "analysis": {
    "department": "Public Works Department (PWD)",
    "category": "Roads and public works",
    "priority": "Medium",
    "summary": "The complaint concerns potholes near a school entrance.",
    "duplicateReferences": [],
    "duplicateReason": ""
  }
}
```

Configuration, provider, parsing, or persistence failures return `{ "success": false, "message": "..." }`. AI suggestions do not execute routing or status changes.

### Sign out — `signOut`

- **Method at UI boundary:** Next.js Server Action; sign-out form submission
- **Access:** Signed-in user
- **Parameters:** None
- **Success:** Clears the Supabase session and redirects to `/login`.
- **Failure:** Throws an error if Supabase cannot sign the user out.

## Authentication callback endpoint

### `GET /auth/confirm`

Used by Supabase email-confirmation and officer-invitation links.

| Query parameter | Type | Required | Description |
|---|---|---:|---|
| `code` | string | One of `code` or `token_hash` | Supabase PKCE authorization code, exchanged for a session |
| `token_hash` | string | One of `code` or `token_hash` | Supabase email OTP token hash |
| `type` | string | Required with `token_hash` | Supabase email OTP type, such as `signup`, `invite`, or `recovery` |
| `next` | string | No | Recognized internal destinations are `/officer/register` and `/set-password`; otherwise the callback uses `/dashboard` |

Example invitation URL shape (values are Supabase template substitutions):

```text
https://portal.example.test/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/officer/register
```

Success verifies/exchanges the credential, stores session cookies, and redirects to the selected internal destination. Verification failure redirects to `/login?error=verification_failed` or `/login?error=invitation_expired` for officer invitations. If the link contains neither supported credential form, it redirects to `/auth/confirm-session` to handle the browser-fragment flow.

## Authenticated Supabase RPC endpoints

These are Supabase PostgREST RPC routes, not application-owned Next.js route handlers. They require a valid authenticated Supabase session and the corresponding grants/policies. Call them through the session-bound Supabase client in application code. Direct integrations must follow Supabase's API and RLS configuration.

### `POST /rest/v1/rpc/route_grievance_to_department`

CMO-only routing RPC. Required JSON keys:

```json
{
  "p_grievance_id": "00000000-0000-4000-8000-000000000001",
  "p_department": "Public Works Department (PWD)",
  "p_officer_id": null,
  "p_note": "Please inspect and report the required action."
}
```

Returns the generated grievance reference ID as text, for example:

```json
"GRV-0123456789AB"
```

The RPC validates CMO role, department, optional officer membership, current status, and note length; it updates assignment/status and records workflow events transactionally.

### `POST /rest/v1/rpc/apply_grievance_workflow_action`

Role-checked workflow RPC. All keys are included in the JSON body; use `null` for unused optional values:

```json
{
  "p_grievance_id": "00000000-0000-4000-8000-000000000001",
  "p_action": "report",
  "p_note": "Inspection is complete; repairs have been scheduled.",
  "p_department": null,
  "p_decision": null,
  "p_attachment_path": null,
  "p_attachment_name": null
}
```

The RPC returns the grievance reference ID as text on success. Invalid roles, states, assignments, action parameters, or attachment metadata raise a database error. Allowed `p_action` values are `progress`, `report`, `forward`, `review`, `remark`, and `escalate`; CMO `route` uses the dedicated RPC above.

### `POST /rest/v1/rpc/get_cmo_grievance_dashboard_metrics`

CMO-only dashboard metrics RPC. It takes no application arguments:

```json
{}
```

It returns rows with `metric_group`, `metric_name`, and `total`, grouped for summary, district, department, category, and priority. Calling it without CMO authorization raises a database error.

## Supabase data and Storage APIs

The application uses authenticated Supabase PostgREST and Storage clients. These are not separately documented as a public portal API. Relevant resources include:

- `public.profiles` — role and department lookup, subject to profile RLS.
- `public.grievances` — grievance reads/inserts and constrained CMO AI classification updates.
- `public.grievance_workflow_events` — authorized case history.
- `public.citizen_grievance_feedback` — owner feedback reads/inserts.
- Private Storage bucket `grievance-documents` — authorized upload and read access.

Direct PostgREST or Storage access is only available when Supabase grants, schema exposure, RLS, and Storage policies allow it. Never bypass these protections by using the service-role key in browser code.

## Error handling and status expectations

- Form/server-action validation errors generally return a failure state with a human-readable `message`.
- Authentication and authorization failures may redirect to sign-in or the correct role dashboard.
- Database RPC validation errors are returned by Supabase as database/API errors and surfaced in the form message by the server action.
- Supabase REST calls may use standard HTTP errors (for example 400 for invalid parameters, 401/403 for authentication/authorization, or 5xx for service errors); exact response bodies are provider-managed.
- Groq non-success responses are converted to an action failure message; the Groq API key and complaint text must not be logged or exposed in client code.
- These examples are not a formal compatibility guarantee. A separately versioned API should define stable URL paths, authentication tokens, rate limits, schemas, pagination, and error codes before third-party integrations are built.

