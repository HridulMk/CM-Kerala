import Link from "next/link";
import { connection } from "next/server";
import { requireRole } from "@/lib/auth";
import { getGrievancesForAiAnalysis } from "@/lib/grievance-queries";
import { grievanceStatusLabel } from "@/lib/grievances";

export default async function AiAnalysisPage() {
  await connection();
  await requireRole("cmo_admin");
  const grievances = await getGrievancesForAiAnalysis();

  return (
    <main className="min-h-screen bg-[#f5f7f8]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-[#0f766e]">CM KERALA PORTAL</p>
            <p className="mt-1 text-sm text-slate-500">CMO Admin · AI Analysis</p>
          </div>
          <Link className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50" href="/cmo/dashboard">
            Back to dashboard
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <p className="text-sm font-semibold text-[#0f766e]">Groq-assisted review</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">AI Analysis</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Select a grievance to request a department and category suggestion, priority recommendation, CMO summary, and possible duplicate flags.
        </p>
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          The complaint text and short excerpts from likely matching complaints are sent to Groq for this analysis. Email addresses and phone numbers are masked. Do not rely on AI output as a decision; a CMO reviewer must verify it.
        </p>

        <section aria-label="Grievances available for analysis" className="mt-8 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-xl font-semibold text-slate-900">Select a grievance</h2>
            <p className="text-sm text-slate-500">{grievances.length} shown · newest first</p>
          </div>
          {grievances.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              No grievances are available to analyze.
            </div>
          ) : grievances.map((grievance) => (
            <Link
              className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-sm"
              href={`/cmo/ai-analysis/${grievance.id}`}
              key={grievance.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold text-[#0f766e]">{grievance.reference_id}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">{grievance.topic}</h3>
                </div>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                  {grievanceStatusLabel(grievance.status)}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{grievance.content}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                <span>{grievance.location}</span>
                <span>{grievance.assigned_department ?? "Awaiting department assignment"}</span>
                <span>{new Date(grievance.created_at).toLocaleDateString("en-IN")}</span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
