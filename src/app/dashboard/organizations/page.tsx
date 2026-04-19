import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My organizations" };

type MembershipRow = {
  role: string;
  organizations: {
    id: string;
    slug: string;
    name: string;
    type: string;
    verified: boolean;
    logo_url: string | null;
  } | null;
};

export default async function OrganizationsDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/organizations");

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("role, organizations ( id, slug, name, type, verified, logo_url )")
    .eq("user_id", user.id);

  const orgs = ((memberships ?? []) as unknown as MembershipRow[]).filter(
    (m) => m.organizations
  );

  return (
    <main className="px-6 py-8 max-w-3xl mx-auto text-white">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-gold uppercase tracking-widest mb-1">
            Organizations
          </p>
          <h1 className="font-display text-3xl leading-tight">Your organizations</h1>
        </div>
        <Link
          href="/dashboard/organizations/new"
          className="px-4 py-2 rounded-lg bg-gold text-midnight font-semibold text-sm"
        >
          Register an organization
        </Link>
      </header>

      {orgs.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <p className="text-sm text-txt-secondary">
            You don&apos;t belong to any organization yet. Register a cultural
            institution, resource provider, chamber, school, or nonprofit to
            post content and manage programs on behalf of your org.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {orgs.map((m) => {
            const org = m.organizations!;
            return (
              <li key={org.id}>
                <Link
                  href={`/dashboard/organizations/${org.slug}`}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-gold/15 border border-gold/25 overflow-hidden flex items-center justify-center">
                    {org.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gold text-sm font-semibold">
                        {org.name.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{org.name}</p>
                      {org.verified && (
                        <span className="text-[10px] text-gold uppercase tracking-wider">Verified</span>
                      )}
                    </div>
                    <p className="text-[11px] text-txt-secondary capitalize">
                      {org.type.replace(/_/g, " ")} · your role: {m.role}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
