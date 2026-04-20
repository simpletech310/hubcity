"use client";

import { useContext } from "react";
import { CitiesContext, CityContext } from "@/components/city/CityProvider";
import type { ActiveCity } from "@/lib/city-context";

/**
 * Read the current active city. Returns null only if the provider was wired
 * at a layout that resolves no city (which only happens when the database
 * has zero live cities).
 */
export function useActiveCity(): ActiveCity | null {
  return useContext(CityContext);
}

/**
 * All known cities (live + coming_soon). Useful for the picker.
 */
export function useKnownCities(): ActiveCity[] {
  return useContext(CitiesContext);
}
