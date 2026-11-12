"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import {
  completeOfficerRegistration,
  registerDemoOfficer,
  type OfficerFormState,
} from "@/app/actions/officers";
import { DEPARTMENTS } from "@/lib/grievances";
import { createClient } from "@/lib/supabase/client";

export function OfficerRegistrationForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsPending(true);
    const formData = new FormData(event.currentTarget);
    const result = await registerDemoOfficer(formData);
    if (!result.success) {
      setMessage(result.message);
      setIsPending(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });
    if (error) {
      setMessage(`Account created, but automatic sign-in failed: ${error.message}. Please sign in.`);
      setIsPending(false);
      return;
    }
    router.replace("/department/dashboard");
    router.refresh();
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Full name</span>
        <input
          autoComplete="name"
          className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10"
          minLength={2}
          name="fullName"
          required
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
        <input
          autoComplete="email"
          className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10"
          name="email"
          required
          type="email"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Department</span>
        <select
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10"
          defaultValue=""
          name="department"
          required
        >
          <option disabled value="">Select your department</option>
          {DEPARTMENTS.map((department) => (
            <option key={department} value={department}>{department}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Create password</span>
        <input
          autoComplete="new-password"
          className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Confirm password</span>
        <input
          autoComplete="new-password"
          className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10"
          minLength={8}
          name="confirmation"
          required
          type="password"
        />
      </label>
      {message && (
        <p
          aria-live="polite"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {message}
        </p>
      )}
      <button
        className="h-12 w-full rounded-xl bg-[#0f766e] text-sm font-semibold text-white disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Completing registration..." : "Complete registration"}
      </button>
    </form>
  );
}

const initialState: OfficerFormState = { message: "", success: false };

export function OfficerInvitationRegistrationForm({
  fullName,
}: {
  fullName: string;
}) {
  const [state, action, isPending] = useActionState(
    completeOfficerRegistration,
    initialState,
  );

  return (
    <form action={action} className="mt-8 space-y-5">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Full name</span>
        <input
          autoComplete="name"
          className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10"
          defaultValue={fullName}
          minLength={2}
          name="fullName"
          required
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Department</span>
        <select
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10"
          defaultValue=""
          name="department"
          required
        >
          <option disabled value="">Select your department</option>
          {DEPARTMENTS.map((department) => (
            <option key={department} value={department}>{department}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Create password</span>
        <input
          autoComplete="new-password"
          className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Confirm password</span>
        <input
          autoComplete="new-password"
          className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10"
          minLength={8}
          name="confirmation"
          required
          type="password"
        />
      </label>
      {state.message && (
        <p
          aria-live="polite"
          className={`rounded-lg px-3 py-2 text-sm ${state.success ? "bg-teal-50 text-teal-800" : "bg-red-50 text-red-700"}`}
        >
          {state.message}
        </p>
      )}
      <button
        className="h-12 w-full rounded-xl bg-[#0f766e] text-sm font-semibold text-white disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Completing registration..." : "Complete registration"}
      </button>
    </form>
  );
}
