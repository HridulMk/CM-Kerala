"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PortalLogo } from "@/components/portal-logo";

export default function ConfirmSessionPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Verifying your email link...");

  useEffect(() => {
    let active = true;

    async function completeVerification() {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const hashError = fragment.get("error_description");
      if (hashError) {
        if (active) {
          setMessage("This verification link could not be completed. It may have expired or already been used. Ask the CMO Admin to send a new invitation.");
        }
        return;
      }

      const supabase = createClient();
      const { data: { session }, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) {
        if (active) setMessage(`Could not complete verification: ${sessionError.message}`);
        return;
      }
      if (!session) {
        if (active) {
          setMessage("This verification link is invalid or expired. Ask the CMO Admin to send a new invitation.");
        }
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        if (active) {
          setMessage(`Could not verify the signed-in account${userError ? `: ${userError.message}` : "."}`);
        }
        return;
      }

      const requestedNext = new URLSearchParams(window.location.search).get("next");
      const destination =
        requestedNext === "/officer/register" &&
        user.app_metadata.invited_as === "department_officer"
          ? "/officer/register"
          : requestedNext === "/set-password"
            ? "/set-password"
            : "/dashboard";

      router.replace(destination);
      router.refresh();
    }

    void completeVerification();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7f8] px-5 py-10">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-[0_24px_80px_-40px_rgba(15,55,67,0.35)] sm:p-10">
        <PortalLogo className="mx-auto mb-5 h-12 w-[76px]" />
        <p className="text-sm font-semibold text-[#0f766e]">Account verification</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Verify your account
        </h1>
        <p aria-live="polite" className="mt-4 text-sm leading-6 text-slate-600">
          {message}
        </p>
        {message !== "Verifying your email link..." && (
          <Link
            className="mt-6 inline-block text-sm font-semibold text-[#0f766e] hover:underline"
            href="/login"
          >
            Return to sign in
          </Link>
        )}
      </section>
    </main>
  );
}
