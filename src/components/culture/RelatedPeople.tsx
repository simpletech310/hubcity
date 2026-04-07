"use client";

import { useEffect, useState } from "react";
import PersonCard from "@/components/culture/PersonCard";
import type { NotablePerson } from "@/types/database";

interface RelatedPeopleProps {
  category: string;
  excludeId: string;
}

export default function RelatedPeople({ category, excludeId }: RelatedPeopleProps) {
  const [people, setPeople] = useState<NotablePerson[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/culture/people?category=${category}`);
      if (res.ok) {
        const data = await res.json();
        setPeople((data.people ?? []).filter((p: NotablePerson) => p.id !== excludeId).slice(0, 6));
      }
    }
    load();
  }, [category, excludeId]);

  if (people.length === 0) return null;

  return (
    <div>
      <h2 className="font-heading font-bold text-sm mb-3">More from this category</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-5 px-5">
        {people.map((person) => (
          <div key={person.id} className="w-[160px] shrink-0">
            <PersonCard person={person} />
          </div>
        ))}
      </div>
    </div>
  );
}
