import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "city_official"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Recent searches
    const { data: recentSearches } = await supabase
      .from("search_queries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    // Top search terms (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data: allSearches } = await supabase
      .from("search_queries")
      .select("query")
      .gte("created_at", thirtyDaysAgo);

    // Count term frequency
    const termCounts: Record<string, number> = {};
    if (allSearches) {
      for (const s of allSearches) {
        const q = s.query.toLowerCase().trim();
        termCounts[q] = (termCounts[q] || 0) + 1;
      }
    }

    const topTerms = Object.entries(termCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([term, count]) => ({ term, count }));

    // Stats
    const { count: totalSearches } = await supabase
      .from("search_queries")
      .select("*", { count: "exact", head: true });

    const { count: searchesThisWeek } = await supabase
      .from("search_queries")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());

    return NextResponse.json({
      recent: recentSearches ?? [],
      top_terms: topTerms,
      stats: {
        total: totalSearches ?? 0,
        this_week: searchesThisWeek ?? 0,
      },
    });
  } catch (error) {
    console.error("Search analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch search analytics" },
      { status: 500 }
    );
  }
}
