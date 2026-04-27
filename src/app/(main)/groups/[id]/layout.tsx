import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { buildOg } from "@/lib/og";

/**
 * Server-component layout sibling to the client `page.tsx`. Hosts the
 * `generateMetadata` for /groups/[id] so OG cards unfurl correctly even
 * though the page itself is interactive ("use client").
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const looksLikeUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  let group: {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    image_url: string | null;
    avatar_url: string | null;
  } | null = null;
  if (looksLikeUuid) {
    const { data } = await supabase
      .from("community_groups")
      .select("id, name, slug, description, image_url, avatar_url")
      .eq("id", id)
      .maybeSingle();
    group = data;
  }
  if (!group) {
    const { data } = await supabase
      .from("community_groups")
      .select("id, name, slug, description, image_url, avatar_url")
      .eq("slug", id)
      .maybeSingle();
    group = data;
  }
  if (!group) return { title: "Group not found" };

  return buildOg({
    title: group.name,
    description:
      group.description ?? `${group.name} on Culture — community group.`,
    image: group.image_url || group.avatar_url || null,
    type: "article",
    path: `/groups/${group.slug || group.id}`,
  });
}

export default function GroupLayout({ children }: { children: ReactNode }) {
  return children;
}
