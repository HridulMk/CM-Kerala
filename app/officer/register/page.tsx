import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import {
  OfficerInvitationRegistrationForm,
  OfficerRegistrationForm,
} from "@/components/auth/officer-registration-form";
import { RouteLoading } from "@/components/auth/route-loading";
import { PortalLogo } from "@/components/portal-logo";
import { dashboardPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default function OfficerRegistrationPage() {
  return (
    <Suspense fallback={<RouteLoading label="Loading officer registration..." />}>
      <OfficerRegistrationContent />
    </Suspense>
  );
}

async function OfficerRegistrationContent() {
  await connection();
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError && userError.name !== "AuthSessionMissingError") {
    throw new Error(`Could not verify the current account: ${userError.message}`);
  }

  if (user?.app_metadata.invited_as === "department_officer") {
    if (!user.email_confirmed_at) {
      redirect("/login?error=invitation_expired");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      if (profileError.code === "PGRST205") {
        redirect("/setup-required?issue=profiles-table");
      }
      if (profileError.code === "PGRST116") {
        redirect("/setup-required?issue=missing-profile");
      }
      throw new Error(`Could not load your profile: ${profileError.message}`);
    }
    if (profile.role !== "citizen") {
      redirect(dashboardPath(profile.role));
    }

    const fullName = typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : "";

    return (
      <RegistrationShell
        heading="Complete your officer registration"
        intro={`You are registering as ${user.email}. Choose your department and set a password.`}
        label="Department Officer invitation"
      >
        <OfficerInvitationRegistrationForm fullName={fullName} />
      </RegistrationShell>
    );
  }

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      if (profileError.code === "PGRST205") {
        redirect("/setup-required?issue=profiles-table");
      }
      if (profileError.code === "PGRST116") {
        redirect("/setup-required?issue=missing-profile");
      }
      throw new Error(`Could not load your profile: ${profileError.message}`);
    }

    if (
      profile.role === "citizen" ||
      profile.role === "cmo_admin" ||
      profile.role === "department_officer"
    ) {
      redirect(dashboardPath(profile.role));
    }
    throw new Error("Your account has an unsupported role.");
  }

  return (
    <RegistrationShell
      heading="Register as a Department Officer"
      intro="Choose a department and create an account to access the demo officer dashboard."
      label="Demo registration"
    >
      <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
        Demo mode: anyone can create an officer account. Do not enable public officer registration on a production portal.
      </p>
      <OfficerRegistrationForm />
    </RegistrationShell>
  );
}

function RegistrationShell({
  label,
  heading,
  intro,
  children,
}: {
  label: string;
  heading: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7f8] px-5 py-10">
      <section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-[0_24px_80px_-40px_rgba(15,55,67,0.35)] sm:p-10">
        <PortalLogo className="mb-5 h-12 w-[76px]" />
        <p className="text-sm font-semibold text-[#0f766e]">{label}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          {heading}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{intro}</p>
        {children}
      </section>
    </main>
  );
}
