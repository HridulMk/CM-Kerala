"use client";

import { useActionState } from "react";
import { submitCitizenFeedback, type GrievanceActionState } from "@/app/actions/grievances";

const initialState: GrievanceActionState = { message: "", success: false };

export function CitizenFeedbackForm({ grievanceId }: { grievanceId: string }) {
  const [state, action, isPending] = useActionState(submitCitizenFeedback, initialState);

  return (
    <form action={action} className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
      <input name="grievanceId" type="hidden" value={grievanceId} />
      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Share feedback on the resolution</span>
        <textarea
          className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10"
          maxLength={2000}
          minLength={3}
          name="feedback"
          placeholder="Tell us whether the resolution addressed your concern."
          required
        />
      </label>
      {state.message && (
        <p
          aria-live="polite"
          className={`mt-2 text-sm ${state.success ? "text-teal-800" : "text-red-700"}`}
          role={state.success ? "status" : "alert"}
        >
          {state.message}
        </p>
      )}
      <button
        className="mt-3 rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b625c] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Submitting..." : "Submit feedback"}
      </button>
    </form>
  );
}
