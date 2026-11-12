"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const authError = searchParams.get("error");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
        <input
          autoComplete="email"
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
        <input
          autoComplete="current-password"
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10"
          minLength={8}
          name="password"
          placeholder="At least 8 characters"
          required
          type="password"
        />
      </label>
      {errorMessage && (
        <p aria-live="polite" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      )}
      {authError === "invitation_expired" && (
        <p aria-live="polite" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          This officer invitation could not be verified or has expired. Ask the CMO Admin to send a new invitation, and make sure its link opens the portal’s configured site URL.
        </p>
      )}
      {authError === "verification_failed" && (
        <p aria-live="polite" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          The verification link could not be completed. It may have expired or already been used; request a new link and try again.
        </p>
      )}
      <button
        className="h-12 w-full rounded-xl bg-[#0f766e] text-sm font-semibold text-white transition hover:bg-[#0b625c] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
      <p className="text-center text-xs leading-5 text-slate-400">
        Staff accounts are provisioned by the CMO Admin.{" "}
        <Link className="font-medium text-slate-600 hover:underline" href="/register">
          Register as a Citizen
        </Link>
      </p>
    </form>
  );
}
