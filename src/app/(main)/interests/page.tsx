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
    <main className="culture-surface min-h-dvh">
      <header
        className="px-[18px] pt-5 pb-5"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>§ PERSONALIZE YOUR FEED</div>
        <h1 className="c-hero mt-2" style={{ fontSize: 48, lineHeight: 0.9 }}>What moves you?</h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          Pick the categories you care about. We&apos;ll surface exhibits, events,
          and stories from cultural organizations across your cities.
        </p>
      </header>

      <div className="px-6 py-8 max-w-xl mx-auto">
        <InterestsForm categories={categories} selectedIds={[...selectedIds]} />
      </div>
    </main>
  );
}
