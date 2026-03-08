import { redirect } from "next/navigation";

export default async function EmailPreferencesPage() {
  redirect("/dashboard/profile");
}
