"use client";

import { useActionState } from "react";
import { submitGrievance, type GrievanceActionState } from "@/app/actions/grievances";
import { GRIEVANCE_CATEGORIES, KERALA_DISTRICTS } from "@/lib/grievances";

const initialState: GrievanceActionState = { message: "", success: false };

export function GrievanceSubmitForm({ fullName }: { fullName: string }) {
  const [state, action, isPending] = useActionState(submitGrievance, initialState);

  return (
    <form action={action} className="mt-6 grid gap-5 sm:grid-cols-2">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Subject</span>
        <input
          className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10"
          maxLength={120}
          minLength={3}
          name="topic"
          placeholder="Brief subject of your grievance"
          required
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Your name</span>
        <input
          autoComplete="name"
          className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10"
          defaultValue={fullName}
          maxLength={150}
          minLength={2}
          name="citizenName"
          required
        />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-2 block text-sm font-medium text-slate-700">Location related to the grievance</span>
        <input
          autoComplete="street-address"
          className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10"
          maxLength={300}
          minLength={2}
          name="location"
          placeholder="District, town, ward, or other relevant location"
          required
        />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-2 block text-sm font-medium text-slate-700">District</span>
        <select
          className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10"
          defaultValue=""
          name="district"
          required
        >
          <option value="" disabled>Select the district related to this grievance</option>
          {KERALA_DISTRICTS.map((district) => <option key={district} value={district}>{district}</option>)}
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-2 block text-sm font-medium text-slate-700">Grievance category</span>
        <select
          className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10"
          defaultValue=""
          name="category"
          required
        >
          <option value="" disabled>Select the closest category</option>
          {GRIEVANCE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-2 block text-sm font-medium text-slate-700">Detailed description</span>
        <textarea
          className="min-h-36 w-full resize-y rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10"
          maxLength={5000}
          minLength={20}
          name="content"
          placeholder="Describe the issue, when it occurred, and what action you are requesting."
          required
        />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-2 block text-sm font-medium text-slate-700">Related document (optional)</span>
        <input
          accept=".jpg,.jpeg,.pdf,image/jpeg,application/pdf"
          className="block w-full rounded-lg border border-slate-200 px-3 py-3 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#0f766e]"
          name="document"
          type="file"
        />
        <span className="mt-2 block text-xs text-slate-500">JPG or PDF, up to 10 MB. Documents are private and available only to you and authorized staff.</span>
      </label>

      {state.message && (
        <div
          aria-live="polite"
          className={`rounded-lg px-4 py-3 text-sm sm:col-span-2 ${state.success ? "bg-teal-50 text-teal-800" : "bg-red-50 text-red-700"}`}
          role={state.success ? "status" : "alert"}
        >
          <p>{state.message}</p>
          {state.referenceId && (
            <p className="mt-1 font-semibold">
              Reference ID: <span className="font-mono">{state.referenceId}</span>
            </p>
          )}
        </div>
      )}

      <button
        className="h-12 rounded-xl bg-[#0f766e] px-5 text-sm font-semibold text-white transition hover:bg-[#0b625c] disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Submitting grievance..." : "Submit grievance"}
      </button>
    </form>
  );
}
