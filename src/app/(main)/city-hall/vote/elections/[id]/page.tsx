import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildOg } from "@/lib/og";

interface Election {
  id: string;
  slug: string;
  name: string;
  election_date: string;
  registration_deadline: string | null;
  type: string;
  description: string | null;
  info_url: string | null;
}

interface Candidate {
  id: string;
  name: string;
  office: string;
  party: string | null;
  bio: string | null;
  photo_url: string | null;
  website: string | null;
}

async function loadElection(id: string): Promise<Election | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("elections")
    .select(
      "id, slug, name, election_date, registration_deadline, type, description, info_url",
    )
    .eq("is_published", true)
    .or(`id.eq.${id},slug.eq.${id}`)
    .maybeSingle();
  return (data as Election | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const ev = await loadElection(id);
  if (!ev) return { title: "Election not found" };
  return buildOg({
    title: ev.name,
    description:
      ev.description ?? `Compton ${ev.type} election on ${ev.election_date}.`,
    image: null,
    type: "article",
    path: `/city-hall/vote/elections/${ev.slug || ev.id}`,
  });
}

export default async function ElectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ev = await loadElection(id);
  if (!ev) notFound();

  const supabase = await createClient();
  const { data: candidates } = await supabase
    .from("candidates")
    .select("id, name, office, party, bio, photo_url, website")
    .eq("election_id", ev.id)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  const list = (candidates ?? []) as Candidate[];
  const byOffice = new Map<string, Candidate[]>();
  for (const c of list) {
    const arr = byOffice.get(c.office) ?? [];
    arr.push(c);
    byOffice.set(c.office, arr);
  }

  const date = new Date(`${ev.election_date}T00:00:00`);

  return (
    <div className="px-5 pt-6 pb-24 mx-auto max-w-2xl">
      <Link
        href="/city-hall/vote"
        className="c-kicker"
        style={{ color: "var(--ink-mute)" }}
      >
        ← VOTE
      </Link>
      <header className="mt-3 mb-6">
        <p
          className="c-kicker"
          style={{ color: "var(--gold-c)", fontSize: 11 }}
        >
          § {ev.type.toUpperCase()} ·{" "}
          {date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        <h1
          className="c-hero mt-1"
          style={{ fontSize: 36, color: "var(--ink-strong)" }}
        >
          {ev.name}
        </h1>
        {ev.description && (
          <p
            className="c-serif-it mt-3"
            style={{ fontSize: 14, color: "var(--ink-mute)" }}
          >
            {ev.description}
          </p>
        )}
        {ev.info_url && (
          <a
            href={ev.info_url}
            target="_blank"
            rel="noopener noreferrer"
            className="c-kicker inline-block mt-3"
            style={{ color: "var(--gold-c)" }}
          >
            OFFICIAL INFO →
          </a>
        )}
      </header>

      {byOffice.size === 0 ? (
        <div
          className="p-5 text-center"
          style={{
            background: "var(--paper-warm)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <p className="c-card-t" style={{ color: "var(--ink-strong)" }}>
            Candidate list pending.
          </p>
          <p
            className="c-serif-it mt-1"
            style={{ fontSize: 12, color: "var(--ink-mute)" }}
          >
            Once filings close, candidates appear here.
          </p>
        </div>
      ) : (
        Array.from(byOffice.entries()).map(([office, cands]) => (
          <section key={office} className="mb-7">
            <p
              className="c-kicker mb-3"
              style={{ color: "var(--ink-mute)" }}
            >
              § {office.toUpperCase()}
            </p>
            <div className="space-y-2">
              {cands.map((c) => (
                <div
                  key={c.id}
                  className="p-4 flex gap-3 items-start"
                  style={{
                    background: "var(--paper)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  <div
                    className="w-16 h-16 shrink-0 overflow-hidden"
                    style={{
                      background: "var(--ink-strong)",
                      border: "2px solid var(--rule-strong-c)",
                    }}
                  >
                    {c.photo_url ? (
                      <Image
                        src={c.photo_url}
                        alt={c.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="c-card-t"
                      style={{ fontSize: 16, color: "var(--ink-strong)" }}
                    >
                      {c.name}
                    </p>
                    {c.party && (
                      <p
                        className="c-meta"
                        style={{ color: "var(--ink-mute)" }}
                      >
                        {c.party}
                      </p>
                    )}
                    {c.bio && (
                      <p
                        className="c-serif-it mt-1"
                        style={{
                          fontSize: 13,
                          color: "var(--ink-mute)",
                        }}
                      >
                        {c.bio}
                      </p>
                    )}
                    {c.website && (
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="c-kicker inline-block mt-2"
                        style={{ color: "var(--gold-c)" }}
                      >
                        WEBSITE →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
