import { connection } from "next/server";
import { redirect } from "next/navigation";
import { dashboardPath, getSignedInProfile } from "@/lib/auth";

export default async function DashboardRedirect() {
  await connection();
  const profile = await getSignedInProfile();
  redirect(dashboardPath(profile.role));
}
