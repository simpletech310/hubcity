import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Organization" };

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/organizations/${slug}`);

  const { data: org } = await supabase
    .from("organizations")
    .select("id, slug, name, type, description, verified, logo_url, website, email, phone, city_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) notFound();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) notFound();

  const isAdmin = membership.role === "owner" || membership.role === "admin";

  const { data: members } = await supabase
    .from("organization_members")
    .select("role, user_id, profiles:profiles!organization_members_user_id_fkey (id, full_name, avatar_url)")
    .eq("org_id", org.id);

  return (
    <main className="px-6 py-8 max-w-3xl mx-auto text-white">
      <p className="text-[11px] font-semibold text-gold uppercase tracking-widest mb-2">
        {org.type.replace(/_/g, " ")} · your role: {membership.role}
      </p>
      <div className="flex items-center gap-3 mb-1">
        <h1 className="font-display text-3xl leading-tight">{org.name}</h1>
        {org.verified ? (
          <span className="text-[10px] text-gold uppercase tracking-wider bg-gold/10 border border-gold/30 rounded px-2 py-0.5">
            Verified
          </span>
        ) : (
          <span className="text-[10px] text-amber-300 uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 rounded px-2 py-0.5">
            Pending review
          </span>
        )}
      </div>
      {org.description && (
        <p className="mt-3 text-sm text-txt-secondary max-w-prose">
          {org.description}
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3">
          Team ({(members ?? []).length})
        </h2>
        <ul className="space-y-2">
          {(members ?? []).map((m: unknown) => {
            const row = m as {
              role: string;
              user_id: string;
              profiles: { id: string; full_name: string | null; avatar_url: string | null } | null;
            };
            const profile = row.profiles;
            return (
              <li
                key={row.user_id}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3"
              >
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs">
                  {profile?.full_name?.[0] ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{profile?.full_name ?? "Member"}</p>
                  <p className="text-[11px] text-white/50 capitalize">{row.role}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {isAdmin && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3">
            Admin actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href={`/dashboard/organizations/${slug}/members`}
              className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm hover:bg-white/[0.04]"
            >
              Invite staff & curators
            </Link>
            <Link
              href={`/dashboard/organizations/${slug}/content`}
              className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm hover:bg-white/[0.04]"
            >
              Manage culture content
            </Link>
            <Link
              href={`/dashboard/organizations/${slug}/settings`}
              className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm hover:bg-white/[0.04]"
            >
              Settings
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
