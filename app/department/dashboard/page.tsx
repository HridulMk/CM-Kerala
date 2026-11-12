import { connection } from "next/server";
import { signOut } from "@/app/actions/auth";
import { requireRole } from "@/lib/auth";
import { getGrievancesForCurrentUser } from "@/lib/grievance-queries";
import { GrievanceList } from "@/components/grievances/grievance-list";

export default async function DepartmentDashboard() {
  await connection();
  const profile = await requireRole("department_officer");
  const grievances = await getGrievancesForCurrentUser();

  return (
    <main className="min-h-screen bg-[#f5f7f8]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-[#0f766e]">CM KERALA PORTAL</p>
            <p className="mt-1 text-sm text-slate-500">Department Officer workspace</p>
          </div>
          <form action={signOut}>
            <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50" type="submit">Sign out</button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-7">
          <p className="text-sm font-semibold text-[#0f766e]">{profile.department ?? "Department Officer"}</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Welcome, {profile.full_name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Investigate assigned grievances, record progress, submit action-taken reports to the CMO, or forward cases to another department.
          </p>
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Investigation notes and PDFs are visible to CMO Admins and the currently assigned department.
          </div>
        </section>
        <section className="mt-9">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-[#0f766e]">Department work queue</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">Assigned grievances</h2>
            </div>
            <p className="text-sm text-slate-500">{grievances.length} shown · newest first</p>
          </div>
          <GrievanceList grievances={grievances} workflowRole="department_officer" showCitizen />
        </section>
      </div>
    </main>
  );
}
