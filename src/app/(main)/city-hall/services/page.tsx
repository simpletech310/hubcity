"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SectionHeader from "@/components/layout/SectionHeader";
import Chip from "@/components/ui/Chip";
import Icon from "@/components/ui/Icon";
import ServiceCard from "@/components/city-hall/ServiceCard";
import { createClient } from "@/lib/supabase/client";
import type { CityService, Department } from "@/types/database";

interface ServiceWithDept extends CityService {
  department: Department;
}

export default function ServicesPage() {
  const [activeDepartment, setActiveDepartment] = useState("all");
  const [search, setSearch] = useState("");
  const [services, setServices] = useState<ServiceWithDept[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const supabase = createClient();

      const [{ data: servicesData }, { data: deptsData }] = await Promise.all([
        supabase
          .from("city_services")
          .select("*, department:city_departments(*)")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("city_departments")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);

      setServices((servicesData as ServiceWithDept[]) ?? []);
      setDepartments((deptsData as Department[]) ?? []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filtered = services.filter((svc) => {
    if (activeDepartment !== "all" && svc.department_id !== activeDepartment) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      svc.name.toLowerCase().includes(q) ||
      svc.description?.toLowerCase().includes(q) ||
      svc.department?.name.toLowerCase().includes(q)
    );
  });

  const onlineCount = filtered.filter((s) => s.is_online).length;

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
        <div className="c-kicker" style={{ opacity: 0.65 }}>§ CITY HALL · SERVICES</div>
        <h1 className="c-hero mt-2" style={{ fontSize: 48, lineHeight: 0.9 }}>City Services.</h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          Browse all city services across departments.
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
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border-subtle rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all"
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 px-5 mb-5">
        <div className="flex items-center gap-2 bg-card rounded-full px-4 py-2 border border-border-subtle">
          <Icon name="document" size={14} />
          <span className="text-xs font-medium">{filtered.length} Total</span>
        </div>
        <div className="flex items-center gap-2 bg-emerald/10 rounded-full px-4 py-2 border border-emerald/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald" />
          <span className="text-xs font-medium text-emerald">{onlineCount} Online</span>
        </div>
      </div>

      {/* Department Filter Chips */}
      <div className="flex gap-2 px-5 mb-6 overflow-x-auto scrollbar-hide pb-1">
        <Chip
          label="All"
          active={activeDepartment === "all"}
          onClick={() => setActiveDepartment("all")}
        />
        {departments.map((dept) => (
          <Chip
            key={dept.id}
            label={dept.name}
            active={activeDepartment === dept.id}
            onClick={() => setActiveDepartment(dept.id)}
          />
        ))}
      </div>

      {loading ? (
        <div className="px-5 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
      ) : (
        <section className="px-5">
          <SectionHeader
            title={`${filtered.length} Service${filtered.length !== 1 ? "s" : ""} Available`}
            compact
          />
          <div className="space-y-2.5 stagger">
            {filtered.map((svc) => (
              <ServiceCard
                key={svc.id}
                service={svc}
                departmentName={svc.department?.name}
              />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <span className="block mb-3"><Icon name="document" size={48} /></span>
                <p className="text-sm font-medium mb-1">No services found</p>
                <p className="text-xs text-txt-secondary">
                  Try a different search or department
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
