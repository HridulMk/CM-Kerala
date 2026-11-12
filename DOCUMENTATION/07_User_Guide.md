# User Guide

This guide explains how Citizens, CMO Admins, and Department Officers use the CM Kerala Public Service Portal demonstration project. Screen labels may change as the application evolves.

> **Demonstration project:** This portal is not an official Government of Kerala service. Use test information only; do not submit real personal, confidential, or sensitive complaints or documents.

## Getting to the portal

1. Open the portal home page at the configured application URL.
2. Use **Register** to create a Citizen account, or **Sign in** if you already have an account.
3. After successful sign-in, the portal sends you to the dashboard associated with your account role:
   - Citizen: `/citizen/dashboard`
   - CMO Admin: `/cmo/dashboard`
   - Department Officer: `/department/dashboard`
4. Choose **Sign out** from your dashboard when finished.

If you cannot sign in, check your email verification and credentials. If an account is not permitted to open a dashboard, contact the portal administrator; public registration cannot grant CMO Admin privileges.

## Citizen guide

### Create a Citizen account

1. From the home page choose **Register**, or open `/register`.
2. Enter your name, email, and password and submit the form.
3. Open the confirmation email and follow the verification instructions. Depending on the Supabase email template, you may enter a one-time code or open a confirmation link.
4. Sign in at `/login`. Your Citizen dashboard opens after authentication.

### Submit a grievance

1. In the Citizen dashboard, go to **New grievance**.
2. Enter a short subject that describes the concern.
3. Confirm or enter your name.
4. Enter the location related to the issue.
5. Select the Kerala district and the closest grievance category.
6. Describe the issue clearly. Include relevant details and the action you are requesting; the description must contain at least 20 characters.
7. Optionally attach one JPG/JPEG image or PDF document no larger than 10 MB.
8. Select **Submit grievance**.
9. When submission succeeds, note the displayed reference ID. It is also shown on your grievance in the dashboard.

If the form reports an error, review the field messages and file type/size. Do not assume a submission succeeded unless the portal confirms it and shows the reference ID.

### Track a grievance

- The top summary cards show your total submitted, pending, and resolved grievance counts.
- Your recent submissions appear under **Track grievances**, with status and assigned department.
- To find a case, enter its reference ID in **Track by reference number** and choose **Search**. Search requires your Citizen sign-in and only returns your own case.
- Select **Clear** to return to the list of your recent cases.
- Open the grievance details to review the subject, district, category, location, description, attachment, and workflow history.
- Workflow history can include public routing, investigation progress, department reports, forwarding, and CMO review notes. Private CMO internal remarks and escalations are not shown.

Only the most recent 100 cases are shown in the normal list. Use reference search to locate an older grievance.

### Leave feedback after resolution

When a grievance status is **Resolved**, a feedback form appears on its card if you have not already submitted feedback.

1. Read the public updates and resolution details.
2. Describe whether the action addressed your concern.
3. Select **Submit feedback**.

Feedback is limited to one response per resolved grievance. Once recorded, it appears on the grievance in place of the form. Reopening a resolved grievance from the Citizen portal is not currently supported.

## CMO Admin guide

CMO Admin access is provisioned by a trusted administrator. It is not available through public registration.

### Review the dashboard

1. Sign in using the CMO Admin account.
2. Review the total, pending, resolved, and overdue summary cards.
3. Review district, department, category, and priority distributions.
4. Use the case filters to select a district, AI category, AI priority, status, or overdue cases. Overdue means open for more than seven days.
5. Browse the paginated list of grievances. Open case details and any accessible Citizen attachment.

### Route a grievance to a department

1. Find the grievance in the case list and review its details.
2. In the routing controls, select the responsible department.
3. Optionally select an officer from that department. Leave the officer field on the department queue if a specific officer should not be assigned.
4. Add an optional note to provide context or instructions to the department.
5. Select **Send to department**.
6. Confirm the success message. The assigned department/status and case workflow history are updated.

An officer assignment must belong to the selected department. Routing may be rejected if the grievance is in a state that does not allow routing.

### Add internal notes or escalate

1. In a grievance card, choose **Add internal remark** or **Escalate delayed grievance**.
2. Enter a note explaining the administrative context or escalation reason.
3. Submit the action and check the response message.

Internal remarks and escalation notes are visible only to CMO Admins. Escalation requires an open grievance that has been open for more than seven days; closed grievances cannot be remarked or escalated.

### Review a department action report

When a department submits a report, the grievance shows the report-awaiting-review state and CMO review controls:

1. Read the department's action-taken report in the workflow history.
2. Choose **Accept report and resolve** or **Request further department action**.
3. Add a review note and select **Save review**.
4. Confirm the updated status. Public CMO review notes appear in the Citizen workflow history.

### Invite a Department Officer

1. In **Officer administration**, enter the officer's name and work email.
2. Select **Send officer invitation**.
3. Check the confirmation message.
4. The officer follows the email link, chooses a department, and sets a password on the protected registration page.

Invitations require server-side Supabase service-role configuration, correct Auth redirect URLs, and an invitation email template pointing to `/auth/confirm?token_hash=...&type=invite&next=/officer/register`. Do not share or expose the service-role key.

### Use AI analysis

1. Select **Open AI Analysis** from the CMO dashboard.
2. Choose a grievance and open its analysis page.
3. Select **Analyze grievance** and wait for the provider response.
4. Review the suggested department, category, priority, summary, and any potential duplicate references.
5. Verify the complaint details and make all administrative decisions yourself. AI does not route, assign, escalate, or resolve cases.

The feature requires a valid server-side `GROQ_API_KEY` and a compatible configured model. Complaint text and selected duplicate excerpts are sent to Groq after basic email/phone masking. Use synthetic data for demonstrations and follow the project's AI privacy safeguards.

## Department Officer guide

Department Officer accounts are normally created from CMO Admin invitations. Public officer registration is a demonstration feature and should not be enabled for production.

### Complete an invitation

1. Open the invitation email and follow its registration link.
2. Confirm that the link opens the correct portal site.
3. Enter your full name, select your department, and set/confirm a password.
4. Complete registration and sign in if prompted.
5. The officer dashboard displays the officer's department and assigned work queue.

If the invitation is expired or cannot be verified, ask the CMO Admin to send a new invitation. Do not try to bypass the protected invitation flow.

### Work an assigned grievance

1. Open the case from **Assigned grievances**.
2. Read the Citizen's description and any available supporting attachment, plus the CMO routing note and visible case history.
3. To record investigation activity, add an **Investigation progress note**. Optionally attach a PDF report up to 10 MB, then choose **Update progress**.
4. When ready to report actions to the CMO, complete **Submit action-taken report** and choose **Submit report to CMO**.
5. If another department should handle the case, select a different department in **Forward to another department**, add a reason, and choose **Forward grievance**.
6. Check the confirmation or error message after each action. A report awaiting CMO review is shown as such, and further officer progress controls may be unavailable until the CMO reviews it.

Officers can only update cases assigned to their department and, where a case is assigned to a particular officer, only the matching officer can perform the workflow action. Private CMO remarks and escalation notes are not visible to officers.

## Status and visibility

| Status | Meaning for users |
|---|---|
| Submitted | Citizen's grievance has been recorded and awaits review/routing |
| Under review | The grievance is being reviewed |
| Assigned | A department has been assigned |
| In progress | The department has started investigation or further action is requested |
| Action report submitted | Department report is awaiting CMO review |
| Resolved | CMO accepted the action report and resolved the grievance |
| Rejected | Grievance is closed as rejected by an authorized workflow |

Citizens see their own grievance and public workflow updates. Department Officers see cases available to their department/assignment. CMO Admins can see all cases and internal CMO events. Attachments are held in private storage and are shown only to authorized users.

## Troubleshooting

- **Cannot find a reference:** Check the complete `GRV-` reference ID, sign in with the account that submitted it, and search again.
- **Registration email missing:** Check spam and the Supabase Auth email provider configuration; request a fresh verification if the previous link expired.
- **Officer invitation fails:** Ask the CMO Admin to verify the configured site URL, redirect allowlist, invite template, and service-role setup.
- **Document upload fails:** Confirm the accepted file type and 10 MB maximum. Do not upload sensitive documents in a demo.
- **AI analysis unavailable:** Ask the CMO Admin to check the server-side Groq key, model configuration, and provider limits.
- **Setup-required or missing-table error:** The portal administrator must apply all Supabase SQL scripts in the order documented in the root README.
- **Account opens the wrong dashboard:** Sign out and sign back in; ask the portal administrator to verify the profile role and department.

## Important limitations

- The portal does not currently send automatic grievance update emails or SMS.
- Citizens cannot reopen resolved cases through the portal.
- Reference-number lookup is restricted to the signed-in Citizen's own submissions.
- AI output can be inaccurate and must not be treated as an official decision.
- This is a demonstration project, not an official Government of Kerala service.

