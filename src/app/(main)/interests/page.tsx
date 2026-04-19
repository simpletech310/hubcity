import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getMyInterests,
  listCultureCategories,
  type CultureCategory,
  type UserInterest,
} from "@/lib/interests";
import InterestsForm from "./InterestsForm";

export const metadata = {
  title: "Your interests",
};

export default async function InterestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/interests");

  const [categories, mine]: [CultureCategory[], UserInterest[]] = await Promise.all([
    listCultureCategories(),
    getMyInterests(),
  ]);

  const selectedIds = new Set(mine.map((i) => i.category_id));

  return (
    <main className="px-6 py-8 max-w-xl mx-auto text-white">
      <header className="mb-6">
        <p className="text-[11px] font-semibold text-gold uppercase tracking-widest mb-2">
          Personalize Your Culture Feed
        </p>
        <h1 className="font-display text-3xl leading-tight">What moves you?</h1>
        <p className="mt-2 text-sm text-txt-secondary">
          Pick the categories you care about. We&apos;ll surface exhibits, events,
          and stories from cultural organizations across your cities.
        </p>
      </header>

      <InterestsForm categories={categories} selectedIds={[...selectedIds]} />
    </main>
  );
}
