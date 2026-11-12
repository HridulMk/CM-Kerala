"use client";

import { useState } from "react";
import { useActionState } from "react";
import {
  processGrievanceWorkflowAction,
  type GrievanceActionState,
} from "@/app/actions/grievances";
import type { DepartmentOfficerOption } from "@/lib/grievance-queries";
import { DEPARTMENTS, type Grievance } from "@/lib/grievances";

const initialState: GrievanceActionState = { message: "", success: false };

export function GrievanceWorkflowControls({
  grievance,
  role,
  officers = [],
}: {
  grievance: Grievance;
  role: "cmo_admin" | "department_officer";
  officers?: DepartmentOfficerOption[];
}) {
  if (role === "cmo_admin") {
    if (grievance.status === "resolved" || grievance.status === "rejected") return null;
    return (
      <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
        {grievance.status === "action_report_submitted"
          ? <CmoReviewForm grievance={grievance} />
          : <CmoRouteForm grievance={grievance} officers={officers} />}
        <CmoAdminNoteForm grievance={grievance} />
      </div>
    );
  }

  if (grievance.status === "action_report_submitted") {
    return (
      <p className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
        The action-taken report is awaiting CMO review.
      </p>
    );
  }
  if (grievance.status === "resolved" || grievance.status === "rejected") return null;

  return (
    <div className="mt-5 space-y-5 border-t border-slate-100 pt-4">
      <OfficerProgressForm grievance={grievance} />
      <div className="grid gap-4 border-t border-slate-100 pt-4 lg:grid-cols-2">
        <OfficerReportForm grievance={grievance} />
        <OfficerForwardForm grievance={grievance} />
      </div>
    </div>
  );
}

function CmoRouteForm({
  grievance,
  officers,
}: {
  grievance: Grievance;
  officers: DepartmentOfficerOption[];
}) {
  const [state, action, isPending] = useActionState(processGrievanceWorkflowAction, initialState);
  const [department, setDepartment] = useState(grievance.assigned_department ?? "");

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1.2fr_auto]">
      <input name="id" type="hidden" value={grievance.id} />
      <input name="action" type="hidden" value="route" />
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-600">Route to department</span>
        <select
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm"
          defaultValue={grievance.assigned_department ?? ""}
          name="department"
          onChange={(event) => setDepartment(event.target.value)}
          required
        >
          <option value="" disabled>Select department</option>
          {DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-600">Assign to officer (optional)</span>
        <select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm" defaultValue={grievance.assigned_officer_id ?? ""} name="officerId">
          <option value="">Department queue</option>
          {officers.filter((officer) => officer.department === department)
            .map((officer) => <option key={officer.id} value={officer.id}>{officer.full_name}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-600">CMO note to department (optional)</span>
        <textarea
          className="min-h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          maxLength={3000}
          name="note"
          placeholder="Instructions or context for the department"
          rows={2}
        />
      </label>
      <button
        className="h-10 self-end rounded-lg bg-[#0f766e] px-4 text-sm font-semibold text-white disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Sending..." : "Send to department"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

function CmoAdminNoteForm({ grievance }: { grievance: Grievance }) {
  const [state, action, isPending] = useActionState(processGrievanceWorkflowAction, initialState);

  return (
    <form action={action} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_1.5fr_auto]">
      <input name="id" type="hidden" value={grievance.id} />
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-600">Administrative action</span>
        <select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm" name="action">
          <option value="remark">Add internal remark</option>
          <option value="escalate">Escalate delayed grievance</option>
        </select>
        <span className="mt-1 block text-xs text-slate-500">Internal remarks are only visible to CMO Admins.</span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-600">Note</span>
        <textarea
          className="min-h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          maxLength={3000}
          minLength={3}
          name="note"
          placeholder="Administrative note or reason for escalation"
          required
          rows={2}
        />
      </label>
      <button
        className="h-10 self-end rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Saving..." : "Save CMO note"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

function OfficerProgressForm({ grievance }: { grievance: Grievance }) {
  const [state, action, isPending] = useActionState(processGrievanceWorkflowAction, initialState);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <input name="id" type="hidden" value={grievance.id} />
      <input name="action" type="hidden" value="progress" />
      <label className="block sm:col-span-2">
        <span className="mb-1.5 block text-xs font-medium text-slate-600">Investigation progress note</span>
        <textarea
          className="min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          maxLength={3000}
          minLength={3}
          name="note"
          placeholder="Record the investigation steps or progress"
          required
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-slate-600">Investigation PDF (optional)</span>
        <input
          accept=".pdf,application/pdf"
          className="block w-full text-sm text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#0f766e]"
          name="document"
          type="file"
        />
        <span className="mt-1 block text-xs text-slate-500">PDF only, up to 10 MB.</span>
      </label>
      <button
        className="h-10 self-end rounded-lg bg-[#0f766e] px-4 text-sm font-semibold text-white disabled:opacity-60 sm:justify-self-start"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Saving..." : "Update progress"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

function OfficerReportForm({ grievance }: { grievance: Grievance }) {
  const [state, action, isPending] = useActionState(processGrievanceWorkflowAction, initialState);

  return (
    <form action={action} className="rounded-lg bg-slate-50 p-4">
      <input name="id" type="hidden" value={grievance.id} />
      <input name="action" type="hidden" value="report" />
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-800">Submit action-taken report</span>
        <textarea
          className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          maxLength={3000}
          minLength={3}
          name="note"
          placeholder="Describe the action taken and the outcome"
          required
        />
      </label>
      <button
        className="mt-3 h-10 rounded-lg bg-[#0f766e] px-4 text-sm font-semibold text-white disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Submitting..." : "Submit report to CMO"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

function OfficerForwardForm({ grievance }: { grievance: Grievance }) {
  const [state, action, isPending] = useActionState(processGrievanceWorkflowAction, initialState);

  return (
    <form action={action} className="rounded-lg bg-slate-50 p-4">
      <input name="id" type="hidden" value={grievance.id} />
      <input name="action" type="hidden" value="forward" />
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-800">Forward to another department</span>
        <select className="mb-3 h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm" defaultValue="" name="department" required>
          <option value="" disabled>Select next department</option>
          {DEPARTMENTS.filter((department) => department !== grievance.assigned_department)
            .map((department) => <option key={department} value={department}>{department}</option>)}
        </select>
        <textarea
          className="min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          maxLength={3000}
          minLength={3}
          name="note"
          placeholder="Explain why another department should handle this"
          required
        />
      </label>
      <button
        className="mt-3 h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Forwarding..." : "Forward grievance"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

function CmoReviewForm({ grievance }: { grievance: Grievance }) {
  const [state, action, isPending] = useActionState(processGrievanceWorkflowAction, initialState);

  return (
    <form action={action} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <input name="id" type="hidden" value={grievance.id} />
      <input name="action" type="hidden" value="review" />
      <div className="grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-700">CMO decision</span>
          <select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm" name="decision" required>
            <option value="resolved">Accept report and resolve</option>
            <option value="in_progress">Request further department action</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-700">Review note</span>
          <textarea
            className="min-h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            maxLength={3000}
            minLength={3}
            name="note"
            placeholder="Record the CMO review decision"
            required
            rows={2}
          />
        </label>
        <button
          className="h-10 self-end rounded-lg bg-[#0f766e] px-4 text-sm font-semibold text-white disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Saving..." : "Save review"}
        </button>
      </div>
      <ActionMessage state={state} />
    </form>
  );
}

function ActionMessage({ state }: { state: GrievanceActionState }) {
  if (!state.message) return null;
  return (
    <p
      aria-live="polite"
      className={`mt-3 text-xs sm:col-span-3 ${state.success ? "text-teal-800" : "text-red-700"}`}
      role={state.success ? "status" : "alert"}
    >
      {state.message}
    </p>
  );
}
