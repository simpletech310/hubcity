import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import ToastProvider from "@/components/ui/Toast";
import CityProvider from "@/components/city/CityProvider";
import { getAccess } from "@/lib/access";
import {
  getActiveCity,
  getActiveCityFromCookie,
  toActiveCity,
} from "@/lib/city-context";
import { listKnownCities } from "@/lib/cities";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ mode }, activeCity, knownCities, cookieSlug] = await Promise.all([
    getAccess(),
    getActiveCity(),
    listKnownCities(),
    getActiveCityFromCookie(),
  ]);
  const hasActiveCity = Boolean(cookieSlug);
  const cities = knownCities.map(toActiveCity);

  return (
    <CityProvider city={activeCity} cities={cities}>
      <div className="max-w-[430px] mx-auto min-h-dvh relative bg-midnight selection:bg-gold/30 selection:text-white">
        <Header />
        <main className="pt-[64px] pb-24 pb-safe overflow-y-auto overflow-x-hidden scrollbar-hide">
          {children}
        </main>
        <BottomNav accessMode={mode} hasActiveCity={hasActiveCity} />
        <ToastProvider />
      </div>
    </CityProvider>
  );
}
