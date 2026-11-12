import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f5f7f8] px-5 py-10 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col justify-between">
        <header className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-[#0f766e] text-sm font-bold text-white">
            KL
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide text-[#183b45]">GOVERNMENT OF KERALA</p>
            <p className="text-xs text-slate-500">Chief Minister&apos;s Public Service Portal</p>
          </div>
        </header>

        <section className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_-40px_rgba(15,55,67,0.35)] md:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden flex-col justify-between bg-[#0f4c52] p-12 text-white md:flex">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">One portal. Better public service.</p>
              <h1 className="mt-7 max-w-md text-4xl font-semibold leading-tight">
                Connect with the services that matter to you.
              </h1>
              <p className="mt-5 max-w-sm text-sm leading-7 text-teal-50/80">
                Sign in to submit and track requests, or access your government workspace.
              </p>
            </div>
            <p className="text-xs text-teal-100/70">Secure access for citizens and government staff</p>
          </div>
          <div className="p-7 sm:p-11">
            <p className="text-sm font-semibold text-[#0f766e]">Welcome back</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Sign in to your account</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your dashboard opens automatically based on your account access.
            </p>
            <Suspense fallback={<div className="mt-8 h-48" />}>
              <LoginForm />
            </Suspense>
            <p className="mt-7 text-center text-sm text-slate-500">
              New to the portal?{" "}
              <Link className="font-semibold text-[#0f766e] hover:underline" href="/register">
                Create a Citizen account
              </Link>
            </p>
            <p className="mt-3 text-center text-xs text-slate-400">
              Department Officer?{" "}
              <Link className="font-medium text-[#0f766e] hover:underline" href="/officer/register">
                Register as an officer
              </Link>
            </p>
          </div>
        </section>

        <footer className="pt-8 text-center text-xs text-slate-400">
          Government of Kerala · Public Service Portal
        </footer>
      </div>
    </main>
  );
}
