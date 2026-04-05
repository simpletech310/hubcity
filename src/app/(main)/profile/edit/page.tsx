import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileEditForm from "@/components/profile/ProfileEditForm";

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/profile/edit");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, handle, bio, avatar_url, role, district, verification_status")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/profile");
  }

  return <ProfileEditForm profile={profile} />;
}
