"use client";

import Chip from "@/components/ui/Chip";

export interface CityOption {
  slug: string;
  name: string;
}

export interface OwnershipOption {
  badge: string;   // matches a value in businesses.badges
  label: string;   // e.g. "Black-owned"
  color?: string;  // accent hex
}

export const DEFAULT_OWNERSHIP_OPTIONS: OwnershipOption[] = [
  { badge: "black_owned",    label: "Black-owned",    color: "#F2A900" },
  { badge: "hispanic_owned", label: "Brown-owned",    color: "#FF6B6B" },
  { badge: "women_owned",    label: "Women-owned",    color: "#EC4899" },
  { badge: "veteran_owned",  label: "Veteran-owned",  color: "#22C55E" },
  { badge: "lgbtq_friendly", label: "LGBTQ+",         color: "#8B5CF6" },
  { badge: "locally_owned",  label: "Locally-owned",  color: "#06B6D4" },
];

interface Props {
  cities: CityOption[];
  selectedCities: string[];               // city slugs; empty = all
  onCityToggle: (slug: string) => void;
  onClearCities: () => void;

  ownership: OwnershipOption[];
  selectedOwnership: string[];            // badge keys; empty = all
  onOwnershipToggle: (badge: string) => void;

  /** Show an `All cities` chip that clears selection */
  showAllCitiesChip?: boolean;
}

export default function CityOwnershipFilter({
  cities,
  selectedCities,
  onCityToggle,
  onClearCities,
  ownership,
  selectedOwnership,
  onOwnershipToggle,
  showAllCitiesChip = true,
}: Props) {
  const anyCitySelected = selectedCities.length > 0;
  const anyOwnershipSelected = selectedOwnership.length > 0;

  return (
    <div className="space-y-3">
      {/* City row */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-txt-secondary font-bold mb-2 px-5">
          City
        </p>
        <div className="flex gap-2 px-5 overflow-x-auto scrollbar-hide pb-1">
          {showAllCitiesChip && (
            <Chip
              label="All cities"
              active={!anyCitySelected}
              onClick={onClearCities}
            />
          )}
          {cities.map((c) => (
            <Chip
              key={c.slug}
              label={c.name}
              active={selectedCities.includes(c.slug)}
              onClick={() => onCityToggle(c.slug)}
            />
          ))}
        </div>
      </div>

      {/* Ownership row */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-txt-secondary font-bold mb-2 px-5">
          Ownership
        </p>
        <div className="flex gap-2 px-5 overflow-x-auto scrollbar-hide pb-1">
          <Chip
            label="All"
            active={!anyOwnershipSelected}
            onClick={() => {
              // clear all
              selectedOwnership.forEach((b) => onOwnershipToggle(b));
            }}
          />
          {ownership.map((o) => (
            <Chip
              key={o.badge}
              label={o.label}
              active={selectedOwnership.includes(o.badge)}
              onClick={() => onOwnershipToggle(o.badge)}
              color={selectedOwnership.includes(o.badge) ? o.color : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
