import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { buildOg } from "@/lib/og";

export const metadata: Metadata = buildOg({
  title: "Vote — Compton",
  description:
    "Register to vote, find your polling place, and see what's on the next ballot.",
  image: null,
  type: "website",
  path: "/city-hall/vote",
});

const CA_REGISTER_URL = "https://registertovote.ca.gov/";

interface Election {
  id: string;
  slug: string;
  name: string;
  election_date: string;
  registration_deadline: string | null;
  type: string;
  description: string | null;
}

interface PollingLocation {
  id: string;
  district: number | null;
  name: string;
  address: string;
  hours_text: string | null;
}

export default async function VotePage({
  searchParams,
}: {
  searchParams: Promise<{ district?: string }>;
}) {
  const supabase = await createClient();
  const sp = await searchParams;
  const districtFilter = sp.district ? parseInt(sp.district, 10) : null;

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: elections }, { data: pollings }] = await Promise.all([
    supabase
      .from("elections")
      .select(
        "id, slug, name, election_date, registration_deadline, type, description",
      )
      .eq("is_published", true)
      .gte("election_date", today)
      .order("election_date", { ascending: true })
      .limit(8),
    (() => {
      let q = supabase
        .from("polling_locations")
        .select("id, district, name, address, hours_text")
        .order("district", { ascending: true });
      if (districtFilter) q = q.eq("district", districtFilter);
      return q.limit(40);
    })(),
  ]);

  const upcoming = (elections ?? []) as Election[];
  const sites = (pollings ?? []) as PollingLocation[];

  return (
    <div className="px-5 pt-6 pb-24 mx-auto max-w-2xl">
      <header className="mb-6">
        <p className="c-kicker" style={{ color: "var(--ink-mute)" }}>
          § CIVIC · VOTE
        </p>
        <h1
          className="c-hero mt-1"
          style={{ fontSize: 40, color: "var(--ink-strong)" }}
        >
          Your vote, your city.
        </h1>
        <p
          className="c-serif-it mt-2"
          style={{ fontSize: 14, color: "var(--ink-mute)" }}
        >
          Register, find your polling place, and see what&rsquo;s on the next
          ballot.
        </p>
      </header>

      {/* Register CTA */}
      <a
        href={CA_REGISTER_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block press p-5 mb-6"
        style={{
          background: "var(--ink-strong)",
          color: "var(--gold-c)",
          border: "2px solid var(--rule-strong-c)",
        }}
      >
        <p
          className="c-kicker"
          style={{ color: "var(--gold-c)", fontSize: 11 }}
        >
          § STEP 1
        </p>
        <p
          className="c-card-t mt-1"
          style={{ fontSize: 22, color: "var(--paper)" }}
        >
          Register to vote in California.
        </p>
        <p
          className="c-serif-it mt-1"
          style={{ fontSize: 13, opacity: 0.85 }}
        >
          Takes ~2 minutes on the Secretary of State site →
        </p>
      </a>

      {/* Upcoming elections */}
      <section className="mb-7">
        <p className="c-kicker mb-3" style={{ color: "var(--ink-mute)" }}>
          § UPCOMING ELECTIONS
        </p>
        {upcoming.length === 0 ? (
          <div
            className="p-5 text-center"
            style={{
              background: "var(--paper-warm)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <p className="c-card-t" style={{ color: "var(--ink-strong)" }}>
              No upcoming elections on the books.
            </p>
            <p
              className="c-serif-it mt-1"
              style={{ fontSize: 12, color: "var(--ink-mute)" }}
            >
              Check back as Compton municipal cycles publish.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((e) => {
              const date = new Date(`${e.election_date}T00:00:00`);
              return (
                <Link
                  key={e.id}
                  href={`/city-hall/vote/elections/${e.id}`}
                  className="block press"
                  style={{
                    background: "var(--paper)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  <div className="p-4">
                    <p
                      className="c-kicker"
                      style={{ color: "var(--gold-c)", fontSize: 11 }}
                    >
                      § {e.type.toUpperCase()} ·{" "}
                      {date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p
                      className="c-card-t mt-1"
                      style={{ fontSize: 18, color: "var(--ink-strong)" }}
                    >
                      {e.name}
                    </p>
                    {e.description && (
                      <p
                        className="c-serif-it mt-1 line-clamp-2"
                        style={{ fontSize: 13, color: "var(--ink-mute)" }}
                      >
                        {e.description}
                      </p>
                    )}
                    {e.registration_deadline && (
                      <p
                        className="c-meta mt-2"
                        style={{ color: "var(--ink-mute)" }}
                      >
                        Register by{" "}
                        {new Date(
                          `${e.registration_deadline}T00:00:00`,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Polling places */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <p className="c-kicker" style={{ color: "var(--ink-mute)" }}>
            § POLLING PLACES
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {[1, 2, 3, 4].map((d) => (
              <Link
                key={d}
                href={`/city-hall/vote?district=${d}`}
                className="press px-2.5 py-1"
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  background:
                    districtFilter === d
                      ? "var(--gold-c)"
                      : "var(--paper)",
                  color: "var(--ink-strong)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                D{d}
              </Link>
            ))}
            {districtFilter && (
              <Link
                href="/city-hall/vote"
                className="c-kicker"
                style={{ color: "var(--ink-mute)", padding: "1px 8px" }}
              >
                CLEAR
              </Link>
            )}
          </div>
        </div>
        {sites.length === 0 ? (
          <div
            className="p-5 text-center"
            style={{
              background: "var(--paper-warm)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <p className="c-card-t" style={{ color: "var(--ink-strong)" }}>
              No polling locations seeded yet.
            </p>
            <p
              className="c-serif-it mt-1"
              style={{ fontSize: 12, color: "var(--ink-mute)" }}
            >
              Ops will publish precincts ahead of the next cycle.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sites.map((s) => (
              <div
                key={s.id}
                className="p-3"
                style={{
                  background: "var(--paper)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {s.district !== null && (
                    <span
                      className="c-kicker"
                      style={{
                        background: "var(--ink-strong)",
                        color: "var(--gold-c)",
                        padding: "2px 6px",
                        fontSize: 10,
                      }}
                    >
                      D{s.district}
                    </span>
                  )}
                  <p
                    className="c-card-t"
                    style={{ fontSize: 14, color: "var(--ink-strong)" }}
                  >
                    {s.name}
                  </p>
                </div>
                <p
                  className="c-meta mt-1"
                  style={{ color: "var(--ink-mute)" }}
                >
                  {s.address}
                </p>
                {s.hours_text && (
                  <p
                    className="c-serif-it mt-0.5"
                    style={{ fontSize: 12, color: "var(--ink-mute)" }}
                  >
                    {s.hours_text}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
