import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { PortalLogo } from "@/components/portal-logo";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#f5f7f8] px-5 py-10 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col justify-between">
        <header className="flex items-center gap-3">
          <PortalLogo className="h-11 w-[68px]" />
          <div>
            <p className="text-sm font-bold tracking-wide text-[#183b45]">GOVERNMENT OF KERALA</p>
            <p className="text-xs text-slate-500">Chief Minister&apos;s Public Service Portal</p>
          </div>
        </header>
        <section className="mx-auto my-12 w-full max-w-xl rounded-3xl bg-white p-7 shadow-[0_24px_80px_-40px_rgba(15,55,67,0.35)] sm:p-11">
          <p className="text-sm font-semibold text-[#0f766e]">Citizen access</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Create your account</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Register with your email and verify it with a one-time code. Staff accounts are created by the CMO Admin.
          </p>
          <RegisterForm />
          <p className="mt-7 text-center text-sm text-slate-500">
            Already registered?{" "}
            <Link className="font-semibold text-[#0f766e] hover:underline" href="/login">Sign in</Link>
          </p>
        </section>
        <footer className="text-center text-xs text-slate-400">Government of Kerala · Public Service Portal</footer>
      </div>
    </main>
  );
}
