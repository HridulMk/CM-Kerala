# Project Overview

## Problem Statement

Citizens may face difficulty submitting public-service grievances to the right government department and understanding what happens after a complaint is received. Without a clear reference number, visible status updates, or a structured handoff between administrative and department staff, it can be difficult for citizens to follow progress and for officials to coordinate review and action.

The CM Kerala Public Service Portal demonstration project provides a centralized digital workflow for submitting, reviewing, assigning, investigating, and tracking grievances. It is a project prototype and is not an official Government of Kerala service.

## Objectives

- Provide a public information page that explains the portal and directs visitors to sign in or register.
- Allow Citizens to submit grievances with the details needed for review and optional supporting documents.
- Generate a unique reference ID for each successfully submitted grievance.
- Let Citizens securely review their submissions, status, assigned department, public case history, and resolution feedback options.
- Give CMO Admins tools to review, classify, route, monitor, and make decisions on grievances.
- Give Department Officers a dedicated workspace to investigate assigned grievances, record progress, and submit action-taken reports.
- Maintain a structured workflow history while restricting internal administrative remarks to authorized CMO Admins.
- Provide optional AI-assisted analysis as an advisory aid for authorized CMO Admins.

## Scope

### Included

- Public home page with portal information, navigation, sign-in and Citizen-registration links.
- Role-based authentication for Citizens, CMO Admins, and Department Officers.
- Citizen grievance submission with subject, category, location, Kerala district, detailed description, and optional JPG/PDF attachment.
- Database-generated reference IDs and an authenticated Citizen dashboard with counts, reference search, grievance details, status, department, and public workflow history.
- One feedback response per grievance after it is resolved.
- CMO grievance list, filters, counts, district and department statistics, routing, optional officer assignment, internal notes, escalation, and action-report review.
- Department Officer case queue, investigation progress notes, optional PDF uploads, action-taken reports, and department forwarding.
- Optional Groq-based AI suggestions for department, category, priority, summary, and possible duplicate complaints.
- Supabase-backed authentication, PostgreSQL data storage, row-level security, and private document storage.

### Not included

- Automatic email or SMS notifications when a grievance changes status.
- Citizen-initiated reopening of a resolved grievance.
- Public, unauthenticated lookup of grievance details by reference number.
- Production certification, official government integration, or a guarantee of official service delivery.
- A production deployment configuration or assurance that the database scripts have been applied to a hosted Supabase project.

## Features

### Public portal

- Responsive landing page describing Citizen services, grievance handling steps, supported department areas, and role-based tools.
- Header navigation with sign-in and registration actions.
- Public access to informational content without a user account.

### Citizen features

- Citizen registration with email/password and email verification.
- Submit a grievance with a subject, Citizen-selected category, location, district, and description.
- Attach an optional JPG or PDF document, up to 10 MB.
- Receive a unique grievance reference ID after successful submission.
- View total, pending, and resolved grievance counts.
- Search the signed-in Citizen's grievances by reference ID.
- Review current status, assigned department, submission details, own attachment, and Citizen-visible workflow updates and notes.
- Submit one feedback response after a grievance is resolved.

### CMO Admin features

- View and filter grievances by district, AI-suggested category, AI-suggested priority, status, and overdue state.
- Monitor total, pending, resolved, and overdue counts. A grievance is overdue when it has been open for more than seven days.
- Inspect grievance details and attachments.
- Route grievances to departments and optionally assign a Department Officer.
- Record routing notes, private internal remarks, and escalations.
- Review department action-taken reports; resolve a grievance or request further action.
- Review district, department, category, and priority summaries.
- Invite Department Officers through a protected registration process.
- Request optional Groq-powered analysis. AI output is advisory and must be checked by a human decision-maker.

### Department Officer features

- View grievances available to the officer's department and, where applicable, assigned to the individual officer.
- Record investigation progress and attach an optional PDF report, up to 10 MB.
- Submit an action-taken report to the CMO or forward a grievance to another department.
- Review authorized staff workflow history for assigned cases.

### Security and access boundaries

- Dashboard access is based on the database-backed profile role.
- Citizens can access their own grievances and public case history.
- Internal CMO remarks and escalation notes are not visible to Citizens or Department Officers.
- Grievance documents are stored in a private bucket and served through short-lived signed URLs.
- Supabase row-level security controls access to grievance records, workflow events, and feedback.
- Supabase service-role and Groq API keys are intended for server-side use only.
- Public Department Officer registration is a demonstration feature and must not be enabled for a real deployment with sensitive data.

