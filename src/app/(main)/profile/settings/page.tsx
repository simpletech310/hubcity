import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsForm from "@/components/settings/SettingsForm";

const defaultPrefs = {
  events: true,
  resources: true,
  district: true,
  system: true,
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("notification_prefs, role")
    .eq("id", user.id)
    .single();

  const prefs = profile?.notification_prefs ?? defaultPrefs;

  return <SettingsForm initialPrefs={prefs} role={profile?.role ?? null} />;
}
