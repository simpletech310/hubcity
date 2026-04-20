"use client";

/**
 * Client-side provider for the active city. Initial value is hydrated from
 * the server (read from the cookie in a server component / layout) so the
 * first paint never flickers. Components below the provider call
 * `useActiveCity()` to read it; the value is stable until a full reload.
 */

import { createContext, type ReactNode } from "react";
import type { ActiveCity } from "@/lib/city-context";

export const CityContext = createContext<ActiveCity | null>(null);

export type CityProviderProps = {
  city: ActiveCity | null;
  cities?: ActiveCity[];
  children: ReactNode;
};

export const CitiesContext = createContext<ActiveCity[]>([]);

export default function CityProvider({
  city,
  cities = [],
  children,
}: CityProviderProps) {
  return (
    <CityContext.Provider value={city}>
      <CitiesContext.Provider value={cities}>{children}</CitiesContext.Provider>
    </CityContext.Provider>
  );
}
