"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName")).trim();
    const address = String(form.get("email")).trim();
    const password = String(form.get("password"));
    const supabase = createClient();
    const emailRedirectTo = `${window.location.origin}/auth/confirm?next=/dashboard`;
    const { data, error } = await supabase.auth.signUp({
      email: address,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo,
      },
    });

    if (error) {
      setMessage(error.message);
      setMessageIsError(true);
      setIsSubmitting(false);
      return;
    }
    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    setEmail(address);
    setAwaitingCode(true);
    setMessage("Check your email for a verification code or confirmation link. You can use either one.");
    setMessageIsError(false);
    setIsSubmitting(false);
  }

  async function resendCode() {
    setMessage("");
    setIsResending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
      },
    });

    if (error) {
      setMessage(error.message);
      setMessageIsError(true);
    } else {
      setMessage("If this address has a pending signup, a new verification email has been sent.");
      setMessageIsError(false);
    }
    setIsResending(false);
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    const token = String(form.get("token")).trim();
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });

    if (error) {
      setMessage(error.message);
      setMessageIsError(true);
      setIsSubmitting(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return awaitingCode ? (
    <form className="mt-8 space-y-5" onSubmit={verify}>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Email verification code</span>
        <input
          autoComplete="one-time-code"
          className="h-12 w-full rounded-xl border border-slate-200 px-4 text-center text-lg tracking-[0.35em] outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10"
          inputMode="numeric"
          maxLength={6}
          name="token"
          placeholder="Enter code"
          required
        />
      </label>
      <p className="text-xs leading-5 text-slate-500">
        Check the inbox and spam folder for {email}. If the email contains a confirmation link instead, click that link to verify your account.
      </p>
      {message && (
        <p aria-live="polite" className={`rounded-lg px-3 py-2 text-sm ${messageIsError ? "bg-red-50 text-red-700" : "bg-teal-50 text-teal-800"}`}>
          {message}
        </p>
      )}
      <button className="h-12 w-full rounded-xl bg-[#0f766e] text-sm font-semibold text-white disabled:opacity-60" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Verifying..." : "Verify with code"}
      </button>
      <button
        className="w-full py-2 text-sm font-semibold text-[#0f766e] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isResending}
        onClick={resendCode}
        type="button"
      >
        {isResending ? "Sending..." : "Resend verification email"}
      </button>
    </form>
  ) : (
    <form className="mt-8 space-y-5" onSubmit={register}>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Full name</span>
        <input autoComplete="name" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10" minLength={2} name="fullName" required />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
        <input autoComplete="email" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10" name="email" required type="email" />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
        <input autoComplete="new-password" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10" minLength={8} name="password" required type="password" />
      </label>
      {message && <p aria-live="polite" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}
      <button className="h-12 w-full rounded-xl bg-[#0f766e] text-sm font-semibold text-white disabled:opacity-60" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Creating account..." : "Create Citizen account"}
      </button>
    </form>
  );
}
