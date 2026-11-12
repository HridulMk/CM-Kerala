import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { AiAnalysisForm } from "@/components/admin/ai-analysis-form";
import { requireRole } from "@/lib/auth";
import { getGrievanceForAiAnalysis } from "@/lib/grievance-queries";
import { grievanceStatusLabel } from "@/lib/grievances";

export default async function AiAnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  await requireRole("cmo_admin");
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }

  const grievance = await getGrievanceForAiAnalysis(id);
  if (!grievance) notFound();

  return (
    <main className="min-h-screen bg-[#f5f7f8]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5 sm:px-8">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-[#0f766e]">CM KERALA PORTAL</p>
            <p className="mt-1 text-sm text-slate-500">Groq-assisted grievance review</p>
          </div>
          <Link className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50" href="/cmo/ai-analysis">
            All grievances
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <p className="font-mono text-sm font-semibold text-[#0f766e]">{grievance.reference_id}</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{grievance.topic}</h1>
          <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <p><span className="font-medium text-slate-700">Location:</span> {grievance.location}</p>
            <p><span className="font-medium text-slate-700">Status:</span> {grievanceStatusLabel(grievance.status)}</p>
            <p><span className="font-medium text-slate-700">Department:</span> {grievance.assigned_department ?? "Awaiting review"}</p>
            <p><span className="font-medium text-slate-700">Submitted:</span> {new Date(grievance.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
          </div>
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h2 className="text-sm font-semibold text-slate-800">Complaint</h2>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">{grievance.content}</p>
          </div>
          <AiAnalysisForm grievanceId={grievance.id} />
        </section>
      </div>
    </main>
  );
}
