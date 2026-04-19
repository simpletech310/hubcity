import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listLiveCities } from "@/lib/cities";
import NewOrgForm from "./NewOrgForm";

export const metadata = { title: "Register an organization" };

export default async function NewOrganizationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/organizations/new");

  const cities = await listLiveCities();

  return (
    <main className="px-6 py-8 max-w-xl mx-auto text-white">
      <header className="mb-6">
        <p className="text-[11px] font-semibold text-gold uppercase tracking-widest mb-2">
          Organization Registration
        </p>
        <h1 className="font-display text-3xl leading-tight">
          Register your organization
        </h1>
        <p className="mt-2 text-sm text-txt-secondary">
          Museums, resource providers, chambers, schools, and nonprofits. Once an
          admin verifies your org, you can invite staff and post on behalf of it.
        </p>
      </header>

      <NewOrgForm cities={cities.map((c) => ({ id: c.id, name: c.name }))} />
    </main>
  );
}
