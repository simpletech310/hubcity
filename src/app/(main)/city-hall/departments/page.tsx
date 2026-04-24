"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SectionHeader from "@/components/layout/SectionHeader";
import Chip from "@/components/ui/Chip";
import Icon from "@/components/ui/Icon";
import DepartmentCard from "@/components/city-hall/DepartmentCard";
import { createClient } from "@/lib/supabase/client";
import type { Department } from "@/types/database";

const categories = [
  { label: "All", value: "all" },
  { label: "Administration", value: "administration" },
  { label: "Public Safety", value: "public_safety" },
  { label: "Public Works", value: "public_works" },
  { label: "Community", value: "community" },
  { label: "Finance", value: "finance" },
  { label: "Planning", value: "planning" },
  { label: "Parks", value: "parks" },
  { label: "Utilities", value: "utilities" },
];

export default function DepartmentsPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDepartments() {
      setLoading(true);
      const supabase = createClient();
      let query = supabase
        .from("city_departments")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (activeCategory !== "all") {
        query = query.eq("category", activeCategory);
      }

      const { data } = await query;
      setDepartments((data as Department[]) ?? []);
      setLoading(false);
    }
    fetchDepartments();
  }, [activeCategory]);

  const filtered = departments.filter((dept) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      dept.name.toLowerCase().includes(q) ||
      dept.head_name?.toLowerCase().includes(q) ||
      dept.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="culture-surface min-h-dvh animate-fade-in">
      {/* Back + Header */}
      <div
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <Link
          href="/city-hall"
          className="inline-flex items-center gap-1.5 text-sm font-semibold press mb-3"
          style={{ color: "var(--ink-strong)" }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
          City Hall
        </Link>
        <div className="c-kicker" style={{ opacity: 0.65 }}>§ CITY HALL · DIRECTORY</div>
        <h1 className="c-hero mt-2" style={{ fontSize: 48, lineHeight: 0.9 }}>Departments.</h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          Compton city government departments and offices.
        </p>
      </div>

      {/* Search Bar */}
      <div className="px-5 mb-5">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-secondary"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="8" cy="8" r="6" />
            <path d="M14 14l3 3" />
          </svg>
          <input
            type="text"
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 text-sm placeholder:text-txt-secondary focus:outline-none transition-all"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
            }}
          />
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 px-5 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((cat) => (
          <Chip
            key={cat.value}
            label={cat.label}
            active={activeCategory === cat.value}
            onClick={() => setActiveCategory(cat.value)}
          />
        ))}
      </div>

      {loading ? (
        <div className="px-5 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-20" />
          ))}
        </div>
      ) : (
        <section className="px-5">
          <SectionHeader
            title={`${filtered.length} Department${filtered.length !== 1 ? "s" : ""}`}
            compact
          />
          <div className="space-y-2.5 stagger">
            {filtered.map((dept) => (
              <DepartmentCard key={dept.id} department={dept} />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <span className="block mb-3"><Icon name="landmark" size={48} /></span>
                <p className="text-sm font-medium mb-1">No departments found</p>
                <p className="text-xs text-txt-secondary">
                  Try a different search or category
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
