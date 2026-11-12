import { connection } from "next/server";
import { signOut } from "@/app/actions/auth";
import { requireRole } from "@/lib/auth";
import { getCitizenGrievanceCounts, getGrievancesForCurrentUser } from "@/lib/grievance-queries";
import { GrievanceSubmitForm } from "@/components/grievances/grievance-submit-form";
import { GrievanceList } from "@/components/grievances/grievance-list";
import { PortalLogo } from "@/components/portal-logo";

export default async function CitizenDashboard({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string | string[] }>;
}) {
  await connection();
  const profile = await requireRole("citizen");
  const params = await searchParams;
  const rawReference = Array.isArray(params.reference) ? params.reference[0] : params.reference;
  const referenceInput = rawReference?.trim() ?? "";
  const reference = referenceInput.toUpperCase();
  const invalidReference = reference.length > 0 && !/^GRV-[A-F0-9]{12}$/.test(reference);
  const [grievances, counts] = await Promise.all([
    getGrievancesForCurrentUser(
      referenceInput ? (invalidReference ? "" : reference) : undefined,
      false,
    ),
    getCitizenGrievanceCounts(),
  ]);
  const { total, pending, resolved } = counts;
  const matchingTotal = referenceInput ? grievances.length : total;

  return (
    <DashboardShell name={profile.full_name} role="Citizen">
      <section className="rounded-2xl border border-slate-200 bg-white p-7">
        <p className="text-sm font-semibold text-[#0f766e]">Citizen services</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Welcome, {profile.full_name}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Submit a grievance to the Chief Minister&apos;s Public Service Portal and use its reference ID to follow progress.
        </p>
      </section>

      <section aria-label="Grievance summary" className="mt-7 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total submitted" value={total} />
        <SummaryCard label="Pending" value={pending} />
        <SummaryCard label="Resolved" value={resolved} />
      </section>

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <p className="text-sm font-semibold text-[#0f766e]">New grievance</p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-900">Tell us about your concern</h2>
        <GrievanceSubmitForm fullName={profile.full_name} />
      </section>

      <section className="mt-9">
        <form className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 sm:flex sm:items-end sm:gap-4" method="get">
          <label className="block flex-1">
            <span className="mb-2 block text-sm font-medium text-slate-700">Track by reference number</span>
            <input
              autoCapitalize="characters"
              className="h-11 w-full rounded-lg border border-slate-200 px-3 font-mono text-sm uppercase outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10"
              maxLength={16}
              name="reference"
              placeholder="GRV-XXXXXXXXXXXX"
              defaultValue={referenceInput}
            />
          </label>
          <div className="mt-3 flex gap-2 sm:mt-0">
            <button className="h-11 rounded-lg bg-[#0f766e] px-4 text-sm font-semibold text-white hover:bg-[#0b625c]" type="submit">
              Search
            </button>
            {referenceInput && (
              <a className="inline-flex h-11 items-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50" href="/citizen/dashboard">
                Clear
              </a>
            )}
          </div>
          {invalidReference && (
            <p className="mt-3 text-sm text-red-700 sm:basis-full" role="alert">
              Enter a reference number in the format GRV- followed by 12 hexadecimal characters.
            </p>
          )}
        </form>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-[#0f766e]">Your submissions</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">Track grievances</h2>
          </div>
          <p className="text-sm text-slate-500">
            {referenceInput ? `${matchingTotal} matching` : `${total} total`} · {grievances.length} shown · newest first
          </p>
        </div>
        {referenceInput && matchingTotal === 0 && !invalidReference && (
          <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No grievance matched that reference number. Check it and try again.
          </p>
        )}
        <GrievanceList grievances={grievances} showCitizenPortal />
      </section>
    </DashboardShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}

function DashboardShell({ name, role, children }: { name: string; role: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f5f7f8]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <div>
            <div className="flex items-center gap-3">
              <PortalLogo className="h-10 w-[62px]" />
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-[#0f766e]">GOVERNMENT OF KERALA</p>
                <p className="mt-1 text-sm text-slate-500">{role} workspace</p>
              </div>
            </div>
          </div>
          <form action={signOut}>
            <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <p className="mb-5 text-sm text-slate-500">Signed in as {name}</p>
        {children}
      </div>
    </main>
  );
}
