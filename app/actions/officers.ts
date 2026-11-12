"use server";

import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSignedInProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DEPARTMENTS } from "@/lib/grievances";

export type OfficerFormState = {
  message: string;
  success: boolean;
};

const officerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the officer's full name."),
  email: z.string().trim().email("Enter a valid email address."),
});

const officerRegistrationSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid email address."),
  department: z.enum(DEPARTMENTS),
  password: z.string().min(8, "Use a password with at least 8 characters."),
  confirmation: z.string(),
});

const invitedOfficerRegistrationSchema = officerRegistrationSchema.omit({
  email: true,
});

export async function createOfficer(
  _previousState: OfficerFormState,
  formData: FormData,
): Promise<OfficerFormState> {
  const profile = await getSignedInProfile();
  if (profile.role !== "cmo_admin") {
    return { success: false, message: "Only a CMO Admin can invite officers." };
  }

  const parsed = officerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Check the form details." };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) {
    return {
      success: false,
      message: "Officer invitations are not configured: NEXT_PUBLIC_SUPABASE_URL is missing from the server environment.",
    };
  }
  if (!serviceRoleKey) {
    return {
      success: false,
      message: "Officer invitations are not configured: add SUPABASE_SERVICE_ROLE_KEY to the server environment, then restart the app.",
    };
  }
  if (!siteUrl) {
    return {
      success: false,
      message: "Officer invitations are not configured: NEXT_PUBLIC_SITE_URL is missing from the server environment.",
    };
  }
  let siteOrigin: string;
  let siteHostname: string;
  try {
    const configuredSite = new URL(siteUrl);
    if (configuredSite.protocol !== "http:" && configuredSite.protocol !== "https:") {
      throw new Error("Unsupported protocol");
    }
    siteOrigin = configuredSite.origin;
    siteHostname = configuredSite.hostname;
  } catch {
    return {
      success: false,
      message: "Officer invitations are not configured: NEXT_PUBLIC_SITE_URL must be a valid HTTP or HTTPS app URL.",
    };
  }
  if (
    process.env.NODE_ENV === "production" &&
    ["localhost", "127.0.0.1", "::1"].includes(siteHostname)
  ) {
    return {
      success: false,
      message: "Officer invitations are pointing to localhost. Set NEXT_PUBLIC_SITE_URL to the deployed portal URL and restart the app.",
    };
  }

  const adminClient = createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: invitation, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(parsed.data.email, {
      data: { full_name: parsed.data.fullName },
      redirectTo: `${siteOrigin}/auth/confirm?next=/officer/register`,
    });

  if (inviteError) {
    return { success: false, message: `Could not invite officer: ${inviteError.message}` };
  }
  if (!invitation.user) {
    return { success: false, message: "Supabase did not return the invited user." };
  }

  const { error: markerError } = await adminClient.auth.admin.updateUserById(
    invitation.user.id,
    {
      app_metadata: {
        ...invitation.user.app_metadata,
        invited_as: "department_officer",
      },
    },
  );

  if (markerError) {
    return {
      success: false,
      message: `The invitation email was sent, but the secure officer-registration marker could not be set: ${markerError.message}`,
    };
  }

  const { data: preparedProfile, error: profileError } = await adminClient
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
    })
    .eq("id", invitation.user.id)
    .select("id")
    .maybeSingle();

  if (profileError) {
    return {
      success: false,
      message: `The invitation was sent, but the officer profile could not be prepared: ${profileError.message}`,
    };
  }
  if (!preparedProfile) {
    return {
      success: false,
      message: "The invitation was sent, but no profile row was found. Install the Supabase profile schema before inviting officers.",
    };
  }

  return {
    success: true,
    message: `Invitation sent to ${parsed.data.email}. The invitee can set their password and select a department from the secure registration link.`,
  };
}

export async function completeOfficerRegistration(
  _previousState: OfficerFormState,
  formData: FormData,
): Promise<OfficerFormState> {
  const parsed = invitedOfficerRegistrationSchema.safeParse({
    fullName: formData.get("fullName"),
    department: formData.get("department"),
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Check the form details." };
  }
  if (parsed.data.password !== parsed.data.confirmation) {
    return { success: false, message: "The passwords do not match." };
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    return { success: false, message: `Could not verify the invited account: ${userError.message}` };
  }
  if (!user || !user.email_confirmed_at) {
    return { success: false, message: "This invitation is invalid or has expired. Ask the CMO Admin to send a new one." };
  }
  if (user.app_metadata.invited_as !== "department_officer") {
    return { success: false, message: "Officer registration is available only through a valid Department Officer invitation." };
  }

  const { data: profile, error: profileReadError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profileReadError) {
    return { success: false, message: `Could not verify your profile: ${profileReadError.message}` };
  }
  if (profile.role !== "citizen") {
    return { success: false, message: "This officer account has already been registered. Sign in to continue." };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return {
      success: false,
      message: "Officer registration is not configured on the server. Contact the CMO Admin.",
    };
  }

  const adminClient = createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: passwordError } = await adminClient.auth.admin.updateUserById(user.id, {
    password: parsed.data.password,
  });
  if (passwordError) {
    return { success: false, message: `Could not set your password: ${passwordError.message}` };
  }

  const { data: updatedProfile, error: profileUpdateError } = await adminClient
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      role: "department_officer",
      department: parsed.data.department,
    })
    .eq("id", user.id)
    .eq("role", "citizen")
    .select("id")
    .maybeSingle();

  if (profileUpdateError) {
    return { success: false, message: `Your password was set, but your officer profile could not be saved: ${profileUpdateError.message}` };
  }
  if (!updatedProfile) {
    return { success: false, message: "Your officer profile was not updated. Sign in again or contact the CMO Admin." };
  }

  redirect("/department/dashboard");
}

export async function registerDemoOfficer(formData: FormData) {
  const parsed = officerRegistrationSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    department: formData.get("department"),
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Check the form details.",
    };
  }
  if (parsed.data.password !== parsed.data.confirmation) {
    return { success: false, message: "The passwords do not match." };
  }
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_PUBLIC_OFFICER_REGISTRATION !== "true"
  ) {
    return {
      success: false,
      message: "Public officer registration is disabled. Contact the portal administrator.",
    };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return {
      success: false,
      message: "Demo officer registration is not configured. Contact the portal administrator.",
    };
  }

  const adminClient = createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: createdUser, error: createError } =
    await adminClient.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { full_name: parsed.data.fullName },
    });

  if (createError) {
    return { success: false, message: `Could not create the officer account: ${createError.message}` };
  }
  if (!createdUser.user) {
    return { success: false, message: "Supabase did not return the new officer account." };
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert({
      id: createdUser.user.id,
      full_name: parsed.data.fullName,
      role: "department_officer",
      department: parsed.data.department,
    });

  if (profileError) {
    const { error: cleanupError } = await adminClient.auth.admin.deleteUser(
      createdUser.user.id,
    );
    const cleanupMessage = cleanupError
      ? ` The incomplete Auth account could not be removed: ${cleanupError.message}`
      : "";
    return {
      success: false,
      message: `Could not save the officer profile: ${profileError.message}.${cleanupMessage}`,
    };
  }

  return { success: true, message: "Officer account created. Signing you in..." };
}
