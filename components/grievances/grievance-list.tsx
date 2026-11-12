import Link from "next/link";
import type { GrievanceWorkflowEvent, GrievanceWithDocument } from "@/lib/grievance-queries";
import type { DepartmentOfficerOption } from "@/lib/grievance-queries";
import { grievanceStatusLabel } from "@/lib/grievances";
import { GrievanceWorkflowControls } from "@/components/grievances/grievance-workflow-controls";
import { CitizenFeedbackForm } from "@/components/grievances/citizen-feedback-form";

export function GrievanceList({
  grievances,
  showCitizen = false,
  showCitizenPortal = false,
  workflowRole,
  officers = [],
}: {
  grievances: GrievanceWithDocument[];
  showCitizen?: boolean;
  showCitizenPortal?: boolean;
  workflowRole?: "cmo_admin" | "department_officer";
  officers?: DepartmentOfficerOption[];
}) {
  if (grievances.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
        No grievances to show yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grievances.map((grievance) => (
        <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6" key={grievance.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-semibold text-[#0f766e]">{grievance.reference_id}</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">{grievance.topic}</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {workflowRole === "cmo_admin" && (
                <Link
                  className="rounded-lg border border-teal-200 px-3 py-1.5 text-xs font-semibold text-[#0f766e] hover:bg-teal-50"
                  href={`/cmo/ai-analysis/${grievance.id}`}
                >
                  AI review
                </Link>
              )}
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                {grievanceStatusLabel(grievance.status)}
              </span>
            </div>
          </div>
          {isOverdue(grievance) && (
            <p className="mt-2 inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-800">
              Overdue · more than 7 days open
            </p>
          )}
          {showCitizen && <p className="mt-3 text-sm text-slate-600">Submitted by {grievance.citizen_name}</p>}
          <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <p><span className="font-medium text-slate-700">Location:</span> {grievance.location}</p>
            <p><span className="font-medium text-slate-700">District:</span> {grievance.district ?? "Not specified"}</p>
            <p><span className="font-medium text-slate-700">Department:</span> {grievance.assigned_department ?? "Awaiting review"}</p>
            {showCitizenPortal && (
              <p><span className="font-medium text-slate-700">Category:</span> {grievance.citizen_category ?? "Not specified"}</p>
            )}
            {workflowRole === "cmo_admin" && (
              <>
                <p><span className="font-medium text-slate-700">Category:</span> {grievance.category ?? "Awaiting AI analysis"}</p>
                <p><span className="font-medium text-slate-700">Priority:</span> {grievance.priority ?? "Awaiting AI analysis"}</p>
                {grievance.assigned_officer_id && (
                  <p><span className="font-medium text-slate-700">Assigned officer:</span>{" "}
                    {officers.find((officer) => officer.id === grievance.assigned_officer_id)?.full_name ?? "Officer assigned"}
                  </p>
                )}
              </>
            )}
            <p className="sm:col-span-2">
              <span className="font-medium text-slate-700">Submitted:</span>{" "}
              {new Date(grievance.created_at).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{grievance.content}</p>
          {grievance.attachment_name && (
            <div className="mt-4 text-sm">
              {grievance.documentUrl ? (
                <a
                  className="font-semibold text-[#0f766e] underline decoration-teal-300 underline-offset-4 hover:text-[#0b625c]"
                  href={grievance.documentUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  View attached document: {grievance.attachment_name}
                </a>
              ) : (
                <p className="text-amber-800">
                  Could not create a private document link: {grievance.documentError ?? "No access"}
                </p>
              )}
            </div>
          )}
          {(workflowRole || showCitizenPortal) && (
            <WorkflowHistory
              events={grievance.workflowEvents}
              submittedAt={grievance.created_at}
              showSubmission={showCitizenPortal}
              showAttachments={!showCitizenPortal}
            />
          )}
          {showCitizenPortal && grievance.status === "resolved" && (
            grievance.citizenFeedback ? (
              <div className="mt-4 rounded-lg bg-teal-50 p-4">
                <p className="text-sm font-semibold text-teal-900">Your feedback</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-teal-900">{grievance.citizenFeedback.feedback}</p>
                <time className="mt-2 block text-xs text-teal-800">
                  {new Date(grievance.citizenFeedback.created_at).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              </div>
            ) : <CitizenFeedbackForm grievanceId={grievance.id} />
          )}
          {workflowRole && <GrievanceWorkflowControls grievance={grievance} role={workflowRole} officers={officers} />}
        </article>
      ))}
    </div>
  );
}

const eventLabels: Record<GrievanceWorkflowEvent["event_type"], string> = {
  cmo_routed: "CMO routed to department",
  officer_progress: "Investigation progress updated",
  department_report: "Department action-taken report submitted",
  department_forwarded: "Forwarded by department",
  cmo_reviewed: "CMO reviewed action report",
  cmo_remark: "Internal CMO remark",
  cmo_escalated: "CMO escalated grievance",
  cmo_assigned_officer: "Assigned to Department Officer",
};

function isOverdue(grievance: GrievanceWithDocument) {
  return !["resolved", "rejected"].includes(grievance.status)
    && Date.now() - new Date(grievance.created_at).getTime() > 7 * 24 * 60 * 60 * 1000;
}

function WorkflowHistory({
  events,
  submittedAt,
  showSubmission,
  showAttachments,
}: {
  events: GrievanceWorkflowEvent[];
  submittedAt: string;
  showSubmission: boolean;
  showAttachments: boolean;
}) {
  if (events.length === 0 && !showSubmission) return null;

  return (
    <section className="mt-5 border-t border-slate-100 pt-4">
      <h4 className="text-sm font-semibold text-slate-800">Workflow history</h4>
      <ol className="mt-3 space-y-3">
        {showSubmission && (
          <li className="rounded-lg bg-slate-50 p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">Grievance submitted</p>
              <time className="text-xs text-slate-500">
                {new Date(submittedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </time>
            </div>
            <p className="mt-2 text-xs text-slate-500">Status after update: Submitted</p>
          </li>
        )}
        {(showSubmission ? [...events].reverse() : events).map((event) => (
          <li className="rounded-lg bg-slate-50 p-3" key={event.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">{eventLabels[event.event_type]}</p>
              <time className="text-xs text-slate-500">
                {new Date(event.created_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </time>
            </div>
            {(event.from_department || event.to_department) && (
              <p className="mt-1 text-xs text-slate-600">
                {event.from_department ? `${event.from_department} -> ` : ""}
                {event.to_department ?? ""}
              </p>
            )}
            {event.note && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{event.note}</p>}
            {showAttachments && event.attachment_name && (
              <div className="mt-2 text-sm">
                {event.documentUrl ? (
                  <a
                    className="font-semibold text-[#0f766e] underline decoration-teal-300 underline-offset-4"
                    href={event.documentUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    View investigation PDF: {event.attachment_name}
                  </a>
                ) : (
                  <p className="text-amber-800">
                    Could not create a private PDF link: {event.documentError ?? "No access"}
                  </p>
                )}
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500">
              Status after update: {grievanceStatusLabel(event.status_after)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
