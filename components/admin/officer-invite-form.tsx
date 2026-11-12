"use client";

import { useActionState } from "react";
import { createOfficer, type OfficerFormState } from "@/app/actions/officers";

const initialState: OfficerFormState = { message: "", success: false };

export function OfficerInviteForm() {
  const [state, action, isPending] = useActionState(createOfficer, initialState);

  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Officer name</span>
        <input className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10" minLength={2} name="fullName" required />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Work email</span>
        <input autoComplete="email" className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10" name="email" required type="email" />
      </label>
      <p className="text-sm leading-6 text-slate-500">
        The invitee will choose their department and set a password on the secure registration page.
      </p>
      {state.message && (
        <p aria-live="polite" className={`rounded-lg px-3 py-2 text-sm ${state.success ? "bg-teal-50 text-teal-800" : "bg-red-50 text-red-700"}`}>
          {state.message}
        </p>
      )}
      <button className="h-11 w-full rounded-lg bg-[#0f766e] text-sm font-semibold text-white hover:bg-[#0b625c] disabled:opacity-60" disabled={isPending} type="submit">
        {isPending ? "Sending invitation..." : "Send officer invitation"}
      </button>
    </form>
  );
}
