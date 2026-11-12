import Link from "next/link";
import { PortalLogo } from "@/components/portal-logo";

export default function SetupRequiredPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7f8] px-5 py-10">
      <section className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <PortalLogo className="mb-5 h-12 w-[76px]" />
        <p className="text-sm font-semibold text-[#0f766e]">Supabase setup required</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          The portal database setup is incomplete
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          The portal needs the <code className="rounded bg-slate-100 px-1.5 py-0.5">public.profiles</code> and <code className="rounded bg-slate-100 px-1.5 py-0.5">public.grievances</code> tables to load account roles and submissions. One or both tables may be missing from the database/API schema, or your profile row may not exist.
        </p>
        <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-600">
          <li>Open your Supabase project and go to the SQL Editor.</li>
          <li>Run the complete <code className="rounded bg-slate-100 px-1.5 py-0.5">supabase/schema.sql</code> script from this project.</li>
          <li>Then run <code className="rounded bg-slate-100 px-1.5 py-0.5">supabase/grievances.sql</code> to create the grievance table and private document bucket.</li>
          <li>In Project Settings → API, confirm the <code className="rounded bg-slate-100 px-1.5 py-0.5">public</code> schema is exposed to the Data API.</li>
          <li>Refresh this page. If it still fails, confirm that a profile row exists for your Auth user and that Supabase Storage is enabled.</li>
        </ol>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link className="rounded-xl bg-[#0f766e] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0b625c]" href="/dashboard">
            Try again
          </Link>
          <Link className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50" href="/login">
            Back to sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
