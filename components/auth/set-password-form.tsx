"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SetPasswordForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password"));
    const confirmation = String(formData.get("confirmation"));
    if (password !== confirmation) {
      setMessage("The passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">New password</span>
        <input autoComplete="new-password" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10" minLength={8} name="password" required type="password" />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">Confirm password</span>
        <input autoComplete="new-password" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-teal-700/10" minLength={8} name="confirmation" required type="password" />
      </label>
      {message && <p aria-live="polite" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}
      <button className="h-12 w-full rounded-xl bg-[#0f766e] text-sm font-semibold text-white disabled:opacity-60" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Saving password..." : "Save password"}
      </button>
    </form>
  );
}
