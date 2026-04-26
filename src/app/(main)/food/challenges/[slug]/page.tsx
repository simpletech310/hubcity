import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import SaveButton from "@/components/ui/SaveButton";
import CompleteChallengeButton from "@/components/food/CompleteChallengeButton";
import { createClient } from "@/lib/supabase/server";
import type { FoodChallenge, ChallengeCompletion } from "@/types/database";

const typeLabels: Record<string, string> = {
  eating: "Eating Challenge",
  collection: "Collection / Passport",
  photo: "Photo Challenge",
};

function fmtDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: challenge } = await supabase
    .from("food_challenges")
    .select("*, business:businesses(id, name, slug)")
    .eq("slug", slug)
    .maybeSingle();

  if (!challenge) notFound();

  const c = challenge as FoodChallenge;

  const { data: completionsRaw } = await supabase
    .from("challenge_completions")
    .select("*, user:profiles(id, display_name, handle, avatar_url)")
    .eq("challenge_id", c.id)
    .order("completed_at", { ascending: false });

  const completions = (completionsRaw ?? []) as ChallengeCompletion[];
  const photoCompletions = completions.filter((x) => x.photo_url);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let alreadyCompleted = false;
  let isOwner = false;
  if (user) {
    alreadyCompleted = completions.some((x) => x.user_id === user.id);
    if (c.business_id) {
      const { data: biz } = await supabase
        .from("businesses")
        .select("owner_id")
        .eq("id", c.business_id)
        .maybeSingle();
      isOwner = biz?.owner_id === user.id;
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const isLive = c.is_active && c.start_date <= today && c.end_date >= today;
  const isUpcoming = c.start_date > today;

  return (
    <article className="culture-surface min-h-dvh animate-fade-in pb-32">
      {/* Hero with overlaid back/save */}
      {c.image_url ? (
        <div
          className="relative w-full aspect-[16/10] overflow-hidden"
          style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
        >
          <Image
            src={c.image_url}
            alt={c.name}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 px-4 pt-4 flex items-center justify-between z-10">
            <Link
              href="/food/challenges"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] press"
              style={{
                background: "rgba(0,0,0,0.55)",
                color: "#fff",
                border: "2px solid rgba(255,255,255,0.2)",
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M10 12L6 8l4-4" />
              </svg>
              Back
            </Link>
            <SaveButton itemType="resource" itemId={c.id} />
          </div>
        </div>
      ) : (
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <Link
            href="/food/challenges"
            className="c-kicker inline-flex items-center gap-1.5 press"
            style={{ color: "var(--ink-strong)" }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M10 12L6 8l4-4" />
            </svg>
            Back
          </Link>
        </div>
      )}

      {/* Title block */}
      <div className="px-5 pt-5">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="c-kicker" style={{ color: "var(--ink-strong)", opacity: 0.7 }}>
            § {(typeLabels[c.challenge_type] ?? c.challenge_type).toUpperCase()}
          </span>
          {isLive && (
            <span className="c-badge c-badge-ok" style={{ padding: "3px 7px", fontSize: 9 }}>
              LIVE
            </span>
          )}
          {isUpcoming && (
            <span className="c-badge c-badge-gold" style={{ padding: "3px 7px", fontSize: 9 }}>
              UPCOMING
            </span>
          )}
          {!c.is_active && (
            <span className="c-badge c-badge-live" style={{ padding: "3px 7px", fontSize: 9 }}>
              CLOSED
            </span>
          )}
        </div>

        <h1 className="c-hero" style={{ fontSize: 32, lineHeight: 1.02, color: "var(--ink-strong)" }}>
          {c.name}
        </h1>

        {c.business && (
          <p className="c-meta mt-2" style={{ fontSize: 12 }}>
            From{" "}
            <Link
              href={`/business/${c.business.slug || c.business.id}`}
              className="underline"
              style={{ color: "var(--ink-strong)" }}
            >
              {c.business.name}
            </Link>
          </p>
        )}

        {isOwner && (
          <Link
            href="/dashboard/challenges"
            className="inline-block mt-3 c-kicker"
            style={{ color: "var(--gold-c)", background: "var(--ink-strong)", padding: "4px 8px" }}
          >
            EDIT IN DASHBOARD →
          </Link>
        )}
      </div>

      {/* Description */}
      {c.description && (
        <section className="px-5 mt-5">
          <p className="c-body" style={{ color: "var(--ink-strong)" }}>
            {c.description}
          </p>
        </section>
      )}

      {/* Time frame + participants */}
      <section className="px-5 mt-5 grid grid-cols-2 gap-3">
        <div className="p-3 c-frame text-center" style={{ background: "var(--paper-warm)" }}>
          <p className="c-kicker" style={{ fontSize: 9, opacity: 0.7 }}>TIME FRAME</p>
          <p className="c-card-t mt-1" style={{ fontSize: 13, color: "var(--ink-strong)" }}>
            {fmtDate(c.start_date)} – {fmtDate(c.end_date)}
          </p>
        </div>
        <div className="p-3 c-frame text-center" style={{ background: "var(--paper-warm)" }}>
          <p className="c-kicker" style={{ fontSize: 9, opacity: 0.7 }}>COMPLETIONS</p>
          <p className="c-card-t mt-1" style={{ fontSize: 13, color: "var(--ink-strong)" }}>
            {c.participant_count}
          </p>
        </div>
      </section>

      {/* Rules */}
      {c.rules && (
        <section className="px-5 mt-6">
          <p className="c-kicker mb-2" style={{ fontSize: 10, opacity: 0.7 }}>§ RULES</p>
          <div className="c-frame p-4" style={{ background: "var(--paper-warm)" }}>
            <p className="c-body" style={{ color: "var(--ink-strong)" }}>{c.rules}</p>
          </div>
        </section>
      )}

      {/* Prize */}
      {c.prize_description && (
        <section className="px-5 mt-6">
          <p className="c-kicker mb-2" style={{ fontSize: 10, opacity: 0.7 }}>§ PRIZE</p>
          <div className="c-frame p-4 flex items-start gap-3" style={{ background: "var(--paper-warm)" }}>
            <Icon name="trophy" size={20} style={{ color: "var(--ink-strong)", marginTop: 2 }} />
            <p className="c-body" style={{ color: "var(--ink-strong)" }}>
              {c.prize_description}
            </p>
          </div>
        </section>
      )}

      {/* Completion gallery */}
      {photoCompletions.length > 0 && (
        <section className="px-5 mt-8">
          <p className="c-kicker mb-2" style={{ fontSize: 10, opacity: 0.7 }}>
            § THEY DID IT — {photoCompletions.length} PHOTO{photoCompletions.length === 1 ? "" : "S"}
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {photoCompletions.map((p) => (
              <div
                key={p.id}
                className="aspect-square overflow-hidden"
                style={{ border: "2px solid var(--rule-strong-c)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.photo_url!}
                  alt={p.caption ?? `Completion by ${p.user?.display_name ?? "user"}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Completers list */}
      {completions.length > 0 && (
        <section className="px-5 mt-6">
          <p className="c-kicker mb-2" style={{ fontSize: 10, opacity: 0.7 }}>
            § COMPLETERS
          </p>
          <div className="c-frame p-3" style={{ background: "var(--paper-warm)" }}>
            <ul className="space-y-2">
              {completions.slice(0, 50).map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 shrink-0 overflow-hidden"
                    style={{
                      background: "var(--ink-strong)",
                      border: "2px solid var(--rule-strong-c)",
                    }}
                  >
                    {p.user?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.user.avatar_url}
                        alt={p.user.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--gold-c)", fontSize: 12 }}>
                        {(p.user?.display_name ?? "?").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="c-card-t truncate"
                      style={{ fontSize: 13, color: "var(--ink-strong)" }}
                    >
                      {p.user?.display_name ?? "Anonymous"}
                    </p>
                    {p.caption && (
                      <p className="c-meta truncate" style={{ fontSize: 11 }}>
                        {p.caption}
                      </p>
                    )}
                  </div>
                  <span className="c-meta shrink-0" style={{ fontSize: 10 }}>
                    {new Date(p.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Sticky CTA */}
      {isLive && !alreadyCompleted && user && (
        <div
          className="fixed bottom-0 inset-x-0 px-5 pt-3 pb-6 z-30"
          style={{
            background: "var(--paper)",
            borderTop: "3px solid var(--rule-strong-c)",
          }}
        >
          <CompleteChallengeButton challengeId={c.id} challengeName={c.name} />
        </div>
      )}

      {alreadyCompleted && (
        <section className="px-5 mt-8">
          <div
            className="c-frame p-4 flex items-center gap-3"
            style={{ background: "var(--paper-warm)" }}
          >
            <Icon name="check" size={20} style={{ color: "var(--ink-strong)" }} />
            <p className="c-body" style={{ color: "var(--ink-strong)" }}>
              You&rsquo;ve completed this challenge.
            </p>
          </div>
        </section>
      )}

      {!user && isLive && (
        <section className="px-5 mt-8">
          <Link
            href={`/login?next=/food/challenges/${c.slug}`}
            className="c-btn c-btn-primary w-full press inline-block text-center"
          >
            SIGN IN TO PARTICIPATE
          </Link>
        </section>
      )}
    </article>
  );
}
