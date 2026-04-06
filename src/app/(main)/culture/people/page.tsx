"use client";

import { useState, useEffect } from "react";
import CultureHero from "@/components/culture/CultureHero";
import MuseumNav from "@/components/culture/MuseumNav";
import PersonCard from "@/components/culture/PersonCard";
import Chip from "@/components/ui/Chip";
import type { NotablePerson } from "@/types/database";

const categories = [
  { label: "All", value: "all", icon: "👤" },
  { label: "Music", value: "music", icon: "🎵" },
  { label: "Sports", value: "sports", icon: "🏆" },
  { label: "Politics", value: "politics", icon: "🏛️" },
  { label: "Activism", value: "activism", icon: "✊" },
  { label: "Arts", value: "arts", icon: "🎨" },
  { label: "Business", value: "business", icon: "💼" },
  { label: "Education", value: "education", icon: "🎓" },
];

export default function PeoplePage() {
  const [people, setPeople] = useState<NotablePerson[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.set("category", activeCategory);
      const res = await fetch(`/api/culture/people?${params}`);
      const data = await res.json();
      setPeople(data.people ?? []);
      setLoading(false);
    }
    load();
  }, [activeCategory]);

  return (
    <div className="space-y-6 pb-20">
      <CultureHero
        title="Notable People"
        subtitle="The musicians, athletes, leaders, and visionaries who shaped Compton."
      />

      <div className="px-5">
        <MuseumNav />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 px-5 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((cat) => (
          <Chip
            key={cat.value}
            label={cat.label}
            icon={<span className="text-sm">{cat.icon}</span>}
            active={activeCategory === cat.value}
            onClick={() => setActiveCategory(cat.value)}
          />
        ))}
      </div>

      {loading ? (
        <div className="px-5 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      ) : people.length > 0 ? (
        <section className="px-5">
          <div className="grid grid-cols-2 gap-3">
            {people.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>
        </section>
      ) : (
        <div className="text-center py-16 px-5">
          <span className="text-5xl block mb-3">👤</span>
          <p className="text-sm font-medium mb-1">People profiles coming soon</p>
          <p className="text-xs text-txt-secondary">
            We're documenting the stories of Compton's most influential figures.
          </p>
        </div>
      )}
    </div>
  );
}
