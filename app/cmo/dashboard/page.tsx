import { connection } from "next/server";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { OfficerInviteForm } from "@/components/admin/officer-invite-form";
import { PortalLogo } from "@/components/portal-logo";
import { GrievanceList } from "@/components/grievances/grievance-list";
import { requireRole } from "@/lib/auth";
import {
  getCmoCategories,
  getCmoDashboardGrievances,
  getCmoDashboardMetrics,
  getDepartmentOfficerOptions,
} from "@/lib/grievance-queries";
import { GRIEVANCE_PRIORITIES, GRIEVANCE_STATUSES, KERALA_DISTRICTS } from "@/lib/grievances";

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CmoDashboard({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await connection();
  const profile = await requireRole("cmo_admin");
  const params = await searchParams;
  const [categories, officers, metrics] = await Promise.all([
    getCmoCategories(),
    getDepartmentOfficerOptions(),
    getCmoDashboardMetrics(),
  ]);
  const districtParam = firstParam(params.district);
  const categoryParam = firstParam(params.category);
  const priorityParam = firstParam(params.priority);
  const statusParam = firstParam(params.status);
  const filters = {
    district: districtParam === "unspecified"
      ? "unspecified"
      : KERALA_DISTRICTS.find((district) => district === districtParam),
    category: categoryParam === "unclassified" ? "unclassified" : categories.find((category) => category === categoryParam),
    priority: priorityParam === "unclassified" ? "unclassified" : GRIEVANCE_PRIORITIES.find((priority) => priority === priorityParam),
    status: GRIEVANCE_STATUSES.find((status) => status === statusParam),
    overdue: firstParam(params.overdue) === "true",
    page: Math.max(1, Number.parseInt(firstParam(params.page) ?? "1", 10) || 1),
  };
  const { grievances, total } = await getCmoDashboardGrievances(filters);
  const pageSize = 50;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(filters.page, pageCount);

  return (
    <main className="min-h-screen bg-[#f5f7f8]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <div>
            <div className="flex items-center gap-3">
              <PortalLogo className="h-10 w-[62px]" />
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-[#0f766e]">GOVERNMENT OF KERALA</p>
                <p className="mt-1 text-sm text-slate-500">CMO Admin workspace</p>
              </div>
            </div>
          </div>
          <form action={signOut}>
            <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50" type="submit">Sign out</button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Signed in as {profile.full_name}</p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900">Central grievance administration</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Monitor citizen submissions, route cases, review department action reports, and track district and department performance.
            </p>
          </div>
          <Link className="rounded-xl border border-teal-200 bg-white px-4 py-3 text-sm font-semibold text-[#0f766e] hover:bg-teal-50" href="/cmo/ai-analysis">
            Open AI Analysis
          </Link>
        </section>

        <section aria-label="Grievance overview" className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total grievances" value={metrics.summary.total ?? 0} />
          <MetricCard label="Pending" value={metrics.summary.pending ?? 0} />
          <MetricCard label="Resolved" value={metrics.summary.resolved ?? 0} />
          <MetricCard label="Overdue · 7+ days" value={metrics.summary.overdue ?? 0} warning />
        </section>

        <section className="mt-7 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">District-wise statistics</h2>
            <p className="mt-1 text-sm text-slate-500">All submitted grievances grouped by district.</p>
            <DistributionTable items={metrics.districts} />
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Department-wise statistics</h2>
            <p className="mt-1 text-sm text-slate-500">Current department assignment, including cases awaiting routing.</p>
            <DistributionTable items={metrics.departments} />
          </section>
        </section>

        <section className="mt-7 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Category and priority</h2>
            <p className="mt-1 text-sm text-slate-500">Category and priority are stored from Groq analysis suggestions.</p>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <DistributionTable items={metrics.categories} emptyLabel="No analyzed grievance categories yet." />
              <DistributionTable items={metrics.priorities} emptyLabel="No AI priority assessments yet." />
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Officer administration</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Invite Department Officers to complete their accounts through a secure registration link.
            </p>
            <OfficerInviteForm />
          </section>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#0f766e]">Case management</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">All citizen grievances</h2>
            </div>
            <p className="text-sm text-slate-500">
              {total === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, total)} of {total}
            </p>
          </div>
          <form className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6" method="get">
            <FilterSelect
              name="district"
              label="District"
              value={filters.district ?? ""}
              options={[...KERALA_DISTRICTS, { value: "unspecified", label: "Not specified" }].map((district) =>
                typeof district === "string" ? { value: district, label: district } : district,
              )}
            />
            <FilterSelect
              name="category"
              label="AI category"
              value={filters.category ?? ""}
              options={[...categories.map((category) => ({ value: category, label: category })), { value: "unclassified", label: "Awaiting AI analysis" }]}
            />
            <FilterSelect
              name="priority"
              label="AI priority"
              value={filters.priority ?? ""}
              options={[...GRIEVANCE_PRIORITIES, { value: "unclassified", label: "Awaiting AI analysis" }].map((priority) =>
                typeof priority === "string" ? { value: priority, label: priority } : priority,
              )}
            />
            <FilterSelect
              name="status"
              label="Status"
              value={filters.status ?? ""}
              options={GRIEVANCE_STATUSES.map((status) => ({ value: status, label: status.replaceAll("_", " ") }))}
            />
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
              <input defaultChecked={filters.overdue} name="overdue" type="checkbox" value="true" />
              Overdue only
            </label>
            <div className="flex items-end gap-2">
              <button className="h-10 rounded-lg bg-[#0f766e] px-4 text-sm font-semibold text-white" type="submit">Apply filters</button>
              <Link className="text-sm font-medium text-slate-600 underline" href="/cmo/dashboard">Clear</Link>
            </div>
          </form>

          <GrievanceList grievances={grievances} workflowRole="cmo_admin" showCitizen officers={officers} />
          {pageCount > 1 && (
            <nav aria-label="Grievance pages" className="mt-5 flex items-center justify-between">
              <Link
                aria-disabled={currentPage <= 1}
                className={`rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium ${currentPage <= 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-50"}`}
                href={dashboardPageHref(params, currentPage - 1)}
              >
                Previous
              </Link>
              <span className="text-sm text-slate-600">Page {currentPage} of {pageCount}</span>
              <Link
                aria-disabled={currentPage >= pageCount}
                className={`rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium ${currentPage >= pageCount ? "pointer-events-none opacity-40" : "hover:bg-slate-50"}`}
                href={dashboardPageHref(params, currentPage + 1)}
              >
                Next
              </Link>
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) {
  return (
    <article className={`rounded-2xl border bg-white p-5 ${warning ? "border-red-200" : "border-slate-200"}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${warning ? "text-red-700" : "text-slate-900"}`}>{value}</p>
    </article>
  );
}

function DistributionTable({
  items,
  emptyLabel = "No data available.",
}: {
  items: Array<{ name: string; total: number }>;
  emptyLabel?: string;
}) {
  const sortedItems = [...items].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  const max = Math.max(1, ...sortedItems.map((item) => item.total));
  if (sortedItems.length === 0) {
    return <p className="mt-4 text-sm text-slate-500">{emptyLabel}</p>;
  }
  return (
    <div className="mt-4 max-h-80 space-y-3 overflow-y-auto">
      {sortedItems.map((item) => (
        <div key={item.name}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="truncate text-slate-700">{item.name}</span>
            <span className="font-semibold tabular-nums text-slate-900">{item.total}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-teal-600" style={{ width: `${(item.total / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: readonly string[] | Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm" defaultValue={value} name={name}>
        <option value="">All</option>
        {options.map((option) => {
          const item = typeof option === "string" ? { value: option, label: option } : option;
          return <option key={item.value} value={item.value}>{item.label}</option>;
        })}
      </select>
    </label>
  );
}

function dashboardPageHref(params: SearchParams, page: number) {
  const query = new URLSearchParams();
  for (const key of ["district", "category", "priority", "status", "overdue"]) {
    const value = firstParam(params[key]);
    if (value) query.set(key, value);
  }
  query.set("page", String(page));
  return `/cmo/dashboard?${query.toString()}`;
}
