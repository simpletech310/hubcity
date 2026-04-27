import Link from "next/link";
import Image from "next/image";
import { searchAll, type SearchHit, type SearchKind } from "@/lib/search";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<SearchKind, string> = {
  event: "Events",
  creator: "Creators",
  business: "Businesses",
  album: "Music",
  group: "Groups",
  post: "Posts",
};

const KIND_ALL_HREF: Record<SearchKind, (q: string) => string> = {
  event: (q) => `/events?search=${encodeURIComponent(q)}`,
  creator: (q) => `/creators?q=${encodeURIComponent(q)}`,
  business: (q) => `/businesses?q=${encodeURIComponent(q)}`,
  album: () => "/frequency",
  group: (q) => `/groups?q=${encodeURIComponent(q)}`,
  post: () => "/pulse",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const results = q ? await searchAll(q) : null;

  return (
    <div className="px-5 pt-6 pb-24 mx-auto max-w-2xl">
      <header className="mb-5">
        <p className="c-kicker" style={{ color: "var(--ink-mute)" }}>
          § SEARCH
        </p>
        <h1
          className="c-hero mt-1"
          style={{ fontSize: 36, color: "var(--ink-strong)" }}
        >
          {q ? `${results?.total ?? 0} results.` : "Search the city."}
        </h1>
        <form
          method="get"
          className="mt-3 flex gap-2"
          action="/search"
        >
          <input
            name="q"
            defaultValue={q}
            placeholder="Try: Adiz, yacht, Compton, Source LA…"
            className="flex-1 px-4 py-3 text-sm focus:outline-none"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
            }}
          />
          <button
            type="submit"
            className="c-kicker px-4"
            style={{
              background: "var(--ink-strong)",
              color: "var(--gold-c)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            GO
          </button>
        </form>
      </header>

      {!q && (
        <p
          className="c-serif-it"
          style={{ fontSize: 13, color: "var(--ink-mute)" }}
        >
          Search across events, creators, businesses, music, groups, and
          posts.
        </p>
      )}

      {q && results && results.total === 0 && (
        <div
          className="p-6 text-center"
          style={{
            background: "var(--paper-warm)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <p className="c-card-t" style={{ color: "var(--ink-strong)" }}>
            No matches for &ldquo;{q}&rdquo;.
          </p>
          <p
            className="c-serif-it mt-1"
            style={{ fontSize: 13, color: "var(--ink-mute)" }}
          >
            Try a shorter keyword or check back soon.
          </p>
        </div>
      )}

      {q &&
        results &&
        (Object.keys(results.hits) as SearchKind[]).map((kind) => {
          const list = results.hits[kind];
          if (list.length === 0) return null;
          return (
            <section key={kind} className="mb-7">
              <div className="flex items-end justify-between mb-3">
                <p className="c-kicker" style={{ color: "var(--ink-mute)" }}>
                  § {KIND_LABEL[kind].toUpperCase()}
                </p>
                <Link
                  href={KIND_ALL_HREF[kind](q)}
                  className="c-kicker"
                  style={{ color: "var(--gold-c)" }}
                >
                  VIEW ALL →
                </Link>
              </div>
              <div className="space-y-2">
                {list.map((hit) => (
                  <SearchRow key={hit.id} hit={hit} />
                ))}
              </div>
            </section>
          );
        })}
    </div>
  );
}

function SearchRow({ hit }: { hit: SearchHit }) {
  return (
    <Link
      href={hit.href}
      className="block press"
      style={{
        background: "var(--paper)",
        border: "2px solid var(--rule-strong-c)",
      }}
    >
      <div className="flex items-center gap-3 p-3">
        <div
          className="w-14 h-14 shrink-0 overflow-hidden"
          style={{
            background: "var(--ink-strong)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          {hit.image ? (
            <Image
              src={hit.image}
              alt={hit.title}
              width={56}
              height={56}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="c-card-t line-clamp-1"
            style={{ fontSize: 14, color: "var(--ink-strong)" }}
          >
            {hit.title}
          </p>
          {hit.subtitle && (
            <p
              className="c-meta mt-0.5 line-clamp-1"
              style={{ color: "var(--ink-mute)" }}
            >
              {hit.subtitle}
            </p>
          )}
        </div>
        <span
          className="c-kicker shrink-0"
          style={{ color: "var(--gold-c)" }}
        >
          OPEN →
        </span>
      </div>
    </Link>
  );
}
