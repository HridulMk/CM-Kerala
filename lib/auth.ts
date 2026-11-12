import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "citizen" | "cmo_admin" | "department_officer";

export type UserProfile = {
  id: string;
  full_name: string;
  role: UserRole;
  department: string | null;
};

const dashboardPaths: Record<UserRole, string> = {
  citizen: "/citizen/dashboard",
  cmo_admin: "/cmo/dashboard",
  department_officer: "/department/dashboard",
};

export function dashboardPath(role: UserRole) {
  return dashboardPaths[role];
}

export async function getSignedInProfile(): Promise<UserProfile> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  if (userError) {
    throw new Error(`Could not verify the current user: ${userError.message}`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, role, department")
    .eq("id", user.id)
    .single();

  if (profileError) {
    if (profileError.code === "PGRST205") {
      redirect("/setup-required?issue=profiles-table");
    }
    if (profileError.code === "PGRST116") {
      redirect("/setup-required?issue=missing-profile");
    }
    throw new Error(
      `Could not load your profile: ${profileError.message}`,
    );
  }

  if (
    profile.role !== "citizen" &&
    profile.role !== "cmo_admin" &&
    profile.role !== "department_officer"
  ) {
    throw new Error("Your account has an unsupported role.");
  }

  if (
    profile.role === "citizen" &&
    user.app_metadata.invited_as === "department_officer"
  ) {
    redirect("/officer/register");
  }

  return profile as UserProfile;
}

export async function requireRole(role: UserRole) {
  const profile = await getSignedInProfile();
  if (profile.role !== role) {
    redirect(dashboardPath(profile.role));
  }
  return profile;
}
