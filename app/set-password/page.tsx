import { connection } from "next/server";
import { redirect } from "next/navigation";
import { SetPasswordForm } from "@/components/auth/set-password-form";
import { createClient } from "@/lib/supabase/server";

export default async function SetPasswordPage() {
  await connection();
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=invitation_expired");
  }
  if (error) {
    throw new Error(`Could not verify the invited account: ${error.message}`);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7f8] px-5 py-10">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_24px_80px_-40px_rgba(15,55,67,0.35)] sm:p-10">
        <p className="text-sm font-semibold text-[#0f766e]">Department Officer account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Set your password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Choose a password for {user.email ?? "your invited account"} to finish setting up access.
        </p>
        <SetPasswordForm />
      </section>
    </main>
  );
}
