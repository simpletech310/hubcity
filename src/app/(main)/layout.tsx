import ToastProvider from "@/components/ui/Toast";
import CityProvider from "@/components/city/CityProvider";
import CultureBottomNav from "@/components/culture/CultureBottomNav";
import CultureTopNav from "@/components/culture/CultureTopNav";
import {
  getActiveCity,
  getActiveCityFromCookie,
  toActiveCity,
} from "@/lib/city-context";
import { listKnownCities } from "@/lib/cities";

/**
 * Main app shell (Culture blockprint).
 *
 * - Outer canvas uses the paper palette (`culture-surface`) so child pages
 *   inherit the blockprint background even when they forget to set it.
 * - Each page renders its own Culture masthead; the legacy
 *   `<Header />` chrome (which included the standalone "All Cities"
 *   pill) has been retired. The per-page "CHANGE ↗" kicker in the
 *   location ink-strip is now the primary way to open the city picker.
 * - The bottom nav is the new `CultureBottomNav` — 5 tabs
 *   (FEED · CULT. · REELS · MAP · YOU) with a 3px gold top rule.
 */
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeCity, knownCities] = await Promise.all([
    getActiveCity(),
    listKnownCities(),
  ]);
  // Reserved for future middleware that may care whether the user has
  // explicitly picked a city. Call is kept so the cookie read still
  // primes the request-scoped cache even though we don't branch on it.
  await getActiveCityFromCookie();
  const cities = knownCities.map(toActiveCity);

  return (
    <CityProvider city={activeCity} cities={cities}>
      <div
        className="culture-surface max-w-[430px] mx-auto min-h-dvh relative"
        style={{ color: "var(--ink-strong)" }}
      >
        <CultureTopNav />
        <main className="pb-24 pb-safe overflow-y-auto overflow-x-hidden c-noscroll">
          {children}
        </main>
        <CultureBottomNav />
        <ToastProvider />
      </div>
    </CityProvider>
  );
}
