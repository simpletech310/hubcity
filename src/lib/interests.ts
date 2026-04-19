import { createClient } from "@/lib/supabase/server";

export type CultureCategory = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  sort_order: number;
};

export type UserInterest = {
  category_id: string;
  weight: number;
};

/** Load all active culture categories (small table, ~10 rows; OK to fetch every request). */
export async function listCultureCategories(): Promise<CultureCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("culture_categories")
    .select("id,slug,name,icon,sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as CultureCategory[];
}

/** Read the current user's interests. Empty list for anonymous users. */
export async function getMyInterests(): Promise<UserInterest[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("user_interests")
    .select("category_id,weight")
    .eq("user_id", user.id);
  return (data ?? []) as UserInterest[];
}

/** Compute a match score for a content row's category against the user's interests. */
export function scoreMatch(
  interests: UserInterest[],
  categoryId: string | null | undefined
): number {
  if (!categoryId) return 0;
  const hit = interests.find((i) => i.category_id === categoryId);
  return hit ? hit.weight : 0;
}

/** Sort rows by interest match score (descending) then by provided fallback comparator. */
export function rankByInterest<T extends { category_id?: string | null }>(
  rows: T[],
  interests: UserInterest[],
  fallback: (a: T, b: T) => number = () => 0
): T[] {
  return [...rows].sort((a, b) => {
    const sa = scoreMatch(interests, a.category_id);
    const sb = scoreMatch(interests, b.category_id);
    if (sa !== sb) return sb - sa;
    return fallback(a, b);
  });
}
