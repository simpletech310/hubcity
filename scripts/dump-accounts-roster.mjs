#!/usr/bin/env node
/**
 * Dump a comprehensive roster of every account on the platform:
 *   - profile id
 *   - display name + handle
 *   - role
 *   - email + standardized password
 *   - city
 *   - what's attached (channels, businesses, groups admin'd,
 *     albums, posts count, reels count, events created)
 *
 * Output: writes scripts/_accounts-roster.md and prints a
 * compact table to stdout.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const env = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
} catch {}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// Direct pg connection so we can read auth.users (the supabase.auth.admin
// listUsers endpoint has been throwing "Database error finding users" on
// this project). Mirrors the working connection string used in
// scripts/check-db-direct.mjs.
const pgClient = new pg.Client(
  "postgresql://postgres:6jUT,kHkxtkt$3u@db.fahqtnwwikvocpvvfgqi.supabase.co:5432/postgres",
);

const STANDARD_PASSWORD = "HubCity2026!";

async function main() {
  console.log("Loading every profile + auth user...\n");

  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select(
      "id, display_name, handle, role, verification_status, city_id, bio, follower_count, created_at",
    )
    .order("role", { ascending: true })
    .order("display_name", { ascending: true });
  if (pErr) throw pErr;

  // Auth users → email lookup (read directly from auth.users)
  await pgClient.connect();
  const { rows: authRows } = await pgClient.query(
    "select id, email from auth.users",
  );
  const emails = new Map();
  for (const u of authRows) emails.set(u.id, u.email);
  await pgClient.end();

  const { data: cities } = await supabase.from("cities").select("id, name, slug");
  const cityById = new Map((cities ?? []).map((c) => [c.id, c]));

  // Pull all attachables in batch (simpler than N+1)
  const [channels, businesses, groupMembersAdmin, albums, posts, reels, events] =
    await Promise.all([
      supabase.from("channels").select("id, name, slug, owner_id, scope, type, is_active"),
      supabase.from("businesses").select("id, name, slug, owner_id, business_type, is_published"),
      supabase
        .from("group_members")
        .select("group_id, user_id, role, group:community_groups(id, name, slug)")
        .in("role", ["admin", "moderator"]),
      supabase.from("albums").select("id, title, slug, creator_id, is_published"),
      supabase.from("posts").select("id, author_id"),
      supabase.from("reels").select("id, author_id"),
      supabase
        .from("events")
        .select("id, title, slug, created_by, start_date, is_ticketed, group_id"),
    ]);

  // Index by owner
  const channelsByOwner = group(channels.data ?? [], "owner_id");
  const businessesByOwner = group(businesses.data ?? [], "owner_id");
  const groupsByUser = group(groupMembersAdmin.data ?? [], "user_id");
  const albumsByCreator = group(albums.data ?? [], "creator_id");
  const postsByAuthor = countBy(posts.data ?? [], "author_id");
  const reelsByAuthor = countBy(reels.data ?? [], "author_id");
  const eventsByCreator = group(events.data ?? [], "created_by");

  const roleOrder = [
    "admin",
    "city_official",
    "city_ambassador",
    "chamber_admin",
    "trustee",
    "school_trustee",
    "business_owner",
    "resource_provider",
    "content_creator",
    "creator",
    "citizen",
  ];

  profiles.sort((a, b) => {
    const ai = roleOrder.indexOf(a.role) === -1 ? 99 : roleOrder.indexOf(a.role);
    const bi = roleOrder.indexOf(b.role) === -1 ? 99 : roleOrder.indexOf(b.role);
    if (ai !== bi) return ai - bi;
    return (a.display_name ?? "").localeCompare(b.display_name ?? "");
  });

  // Compose markdown
  const md = [];
  md.push("# Hub City — Accounts Roster\n");
  md.push(`_Generated ${new Date().toISOString()}_\n`);
  md.push("");
  md.push(`**Standard password for every demo account: \`${STANDARD_PASSWORD}\`**\n`);
  md.push(
    "(Per `scripts/standardize-passwords.mjs` — every auth.users row was reset to this password during the last sync.)\n",
  );
  md.push("---\n");

  let currentRole = "";
  for (const p of profiles) {
    if (p.role !== currentRole) {
      currentRole = p.role;
      md.push(`\n## ${(p.role ?? "unknown").toUpperCase()}\n`);
    }
    const email = emails.get(p.id) ?? "(no auth row)";
    const city = cityById.get(p.city_id)?.name ?? "—";
    const verif = p.verification_status ?? "unverified";

    const owns = [];

    const ch = channelsByOwner.get(p.id) ?? [];
    if (ch.length) owns.push(...ch.map((c) => `📺 channel **${c.name}** _(${c.slug})_`));

    const biz = businessesByOwner.get(p.id) ?? [];
    if (biz.length) owns.push(...biz.map((b) => `🏪 business **${b.name}** _(${b.slug})_`));

    const grp = groupsByUser.get(p.id) ?? [];
    if (grp.length) {
      for (const gm of grp) {
        if (gm.group)
          owns.push(`👥 group **${gm.group.name}** _(${gm.group.slug}, ${gm.role})_`);
      }
    }

    const alb = albumsByCreator.get(p.id) ?? [];
    if (alb.length) owns.push(`💿 ${alb.length} album${alb.length > 1 ? "s" : ""}`);

    const evs = eventsByCreator.get(p.id) ?? [];
    if (evs.length) {
      const ticketed = evs.filter((e) => e.is_ticketed).length;
      owns.push(
        `🎟  ${evs.length} event${evs.length > 1 ? "s" : ""}` +
          (ticketed ? ` (${ticketed} ticketed)` : ""),
      );
    }

    const postCount = postsByAuthor.get(p.id) ?? 0;
    const reelCount = reelsByAuthor.get(p.id) ?? 0;
    if (postCount > 0 || reelCount > 0) {
      const bits = [];
      if (postCount) bits.push(`${postCount} post${postCount > 1 ? "s" : ""}`);
      if (reelCount) bits.push(`${reelCount} moment${reelCount > 1 ? "s" : ""}`);
      owns.push(`📝 ${bits.join(" · ")}`);
    }

    md.push(`### ${p.display_name ?? "(no name)"} · @${p.handle ?? "—"}`);
    md.push(`- **Email:** \`${email}\``);
    md.push(`- **Password:** \`${STANDARD_PASSWORD}\``);
    md.push(`- **Role:** \`${p.role}\` · verification: \`${verif}\``);
    md.push(`- **City:** ${city}`);
    if (owns.length === 0) {
      md.push(`- **Attached:** _(none — listener-only account)_`);
    } else {
      md.push(`- **Attached:**`);
      for (const o of owns) md.push(`  - ${o}`);
    }
    md.push("");
  }

  const out = md.join("\n");
  const path = resolve(__dirname, "_accounts-roster.md");
  writeFileSync(path, out, "utf8");
  console.log(`Wrote ${profiles.length} profiles → ${path}\n`);

  // Compact stdout summary
  console.log("Roster summary:");
  const counts = {};
  for (const p of profiles) counts[p.role] = (counts[p.role] ?? 0) + 1;
  for (const [role, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${role.padEnd(22)} ${n}`);
  }
}

function group(rows, key) {
  const m = new Map();
  for (const r of rows) {
    const k = r[key];
    if (!k) continue;
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return m;
}

function countBy(rows, key) {
  const m = new Map();
  for (const r of rows) {
    const k = r[key];
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
