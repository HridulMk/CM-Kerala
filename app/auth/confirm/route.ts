import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";

const emailOtpTypes: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const requestedType = searchParams.get("type");
  const isOfficerRegistration = searchParams.get("next") === "/officer/register";
  const destination = isOfficerRegistration
    ? "/officer/register"
    : searchParams.get("next") === "/set-password"
      ? "/set-password"
      : "/dashboard";

  const response = NextResponse.redirect(new URL(destination, request.url));
  const { url, key } = getSupabaseConfig();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });

  let verificationError: Error | null = null;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    verificationError = error;
  } else if (
    tokenHash &&
    requestedType &&
    emailOtpTypes.includes(requestedType as EmailOtpType)
  ) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: requestedType as EmailOtpType,
    });
    verificationError = error;
  } else {
    const clientDestination = new URL("/auth/confirm-session", request.url);
    clientDestination.searchParams.set(
      "next",
      isOfficerRegistration ? "/officer/register" : destination,
    );
    return NextResponse.redirect(clientDestination);
  }

  if (verificationError) {
    const errorPath = isOfficerRegistration
      ? "/login?error=invitation_expired"
      : "/login?error=verification_failed";
    return NextResponse.redirect(new URL(errorPath, request.url));
  }

  return response;
}
