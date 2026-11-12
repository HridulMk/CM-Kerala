"use client";

import { useActionState } from "react";
import {
  analyzeGrievance,
  type AiAnalysisActionState,
} from "@/app/actions/ai-analysis";

const initialState: AiAnalysisActionState = { message: "", success: false };

export function AiAnalysisForm({ grievanceId }: { grievanceId: string }) {
  const [state, action, isPending] = useActionState(
    analyzeGrievance,
    initialState,
  );
  const analysis = state.analysis;

  return (
    <div className="mt-7">
      <form action={action}>
        <input name="grievanceId" type="hidden" value={grievanceId} />
        <button
          className="rounded-xl bg-[#0f766e] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0b625c] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Analyzing with Groq..." : analysis ? "Run analysis again" : "Analyze grievance"}
        </button>
      </form>

      {state.message && (
        <p
          aria-live="polite"
          className={`mt-4 rounded-lg px-4 py-3 text-sm ${state.success ? "bg-teal-50 text-teal-800" : "bg-red-50 text-red-700"}`}
          role={state.success ? "status" : "alert"}
        >
          {state.message}
        </p>
      )}

      {analysis && (
        <section aria-label="AI analysis result" className="mt-6 rounded-2xl border border-teal-100 bg-teal-50/50 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900">AI analysis</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              analysis.priority === "High"
                ? "bg-red-100 text-red-800"
                : analysis.priority === "Medium"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-700"
            }`}>
              {analysis.priority} priority suggestion
            </span>
          </div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested department</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{analysis.department}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested category</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{analysis.category}</dd>
            </div>
          </dl>
          <div className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary for CMO</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{analysis.summary}</p>
          </div>
          {analysis.duplicateReferences.length > 0 && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-sm font-semibold text-amber-900">Potential duplicates — human review recommended</h3>
              <p className="mt-1 text-sm leading-6 text-amber-900">{analysis.duplicateReason}</p>
              <ul className="mt-2 list-inside list-disc text-sm text-amber-900">
                {analysis.duplicateReferences.map((reference) => (
                  <li key={reference}>{reference}</li>
                ))}
              </ul>
            </div>
          )}
          {analysis.duplicateReferences.length === 0 && (
            <p className="mt-5 text-sm text-slate-600">No likely duplicate was identified in the complaints checked.</p>
          )}
          <p className="mt-5 border-t border-teal-100 pt-4 text-xs leading-5 text-slate-500">
            AI output is advisory and may be incorrect. The CMO reviewer must verify the department, category, priority, summary, and any duplicate flags.
          </p>
        </section>
      )}
    </div>
  );
}
