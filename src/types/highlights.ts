import type { ReactionEmoji } from "./database";

export interface CityHighlight {
  id: string;
  author_id: string;
  media_url: string;
  media_type: "image" | "video";
  caption: string | null;
  link_url: string | null;
  link_label: string | null;
  media_width: number | null;
  media_height: number | null;
  view_count: number;
  reaction_counts: Partial<Record<ReactionEmoji, number>>;
  is_published: boolean;
  expires_at: string | null;
  created_at: string;
  author?: {
    id: string;
    display_name: string;
    handle: string | null;
    avatar_url: string | null;
    role: string;
  } | null;
}

export interface HighlightReaction {
  highlight_id: string;
  user_id: string;
  emoji: ReactionEmoji;
  created_at: string;
}

export interface HighlightView {
  highlight_id: string;
  user_id: string;
  viewed_at: string;
}
