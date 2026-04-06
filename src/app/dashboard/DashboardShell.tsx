"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import type { Business, Resource } from "@/types/database";

interface TabDef {
  href: string;
  label: string;
  icon: React.ReactNode;
}

// ── Icon components ─────────────────────────────────────
function OverviewIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function BookingsIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ApplicationsIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ResourcesIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SpecialsIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function JobsIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a1 1 0 00-1 1v10a2 2 0 002 2h14a2 2 0 002-2V8a1 1 0 00-1-1zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    </svg>
  );
}

function PollsIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export default function DashboardShell({
  business,
  resources,
  userRole,
  children,
}: {
  business: Business | null;
  resources: Resource[];
  userRole: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isResourceManager = userRole === "city_official" || userRole === "admin";
  const canPostJobs = ["business_owner", "admin", "city_official", "city_ambassador"].includes(userRole);

  const tabs: TabDef[] = useMemo(() => {
    const t: TabDef[] = [];

    // Overview is always first
    t.push({ href: "/dashboard", label: "Overview", icon: <OverviewIcon /> });

    // Business-owner tabs
    if (business) {
      t.push({ href: "/dashboard/orders", label: "Orders", icon: <OrdersIcon /> });
      t.push({ href: "/dashboard/menu", label: "Menu", icon: <MenuIcon /> });
      t.push({ href: "/dashboard/bookings", label: "Bookings", icon: <BookingsIcon /> });
      t.push({ href: "/dashboard/specials", label: "Specials", icon: <SpecialsIcon /> });
      if (business.is_mobile_vendor) {
        t.push({ href: "/dashboard/location", label: "Location", icon: <LocationIcon /> });
      }
      t.push({ href: "/dashboard/analytics", label: "Analytics", icon: <AnalyticsIcon /> });
    }

    // Jobs tab for all allowed roles
    if (canPostJobs) {
      t.push({ href: "/dashboard/jobs", label: "Jobs", icon: <JobsIcon /> });
    }

    // Official/admin tabs: Polls & Surveys
    if (isResourceManager) {
      t.push({ href: "/dashboard/polls", label: "Polls", icon: <PollsIcon /> });
      t.push({ href: "/dashboard/surveys", label: "Surveys", icon: <ApplicationsIcon /> });
      t.push({ href: "/dashboard/applications", label: "Apps", icon: <ResourcesIcon /> });
      t.push({ href: "/dashboard/resources", label: "Resources", icon: <ResourcesIcon /> });
    }

    // Settings always last
    t.push({ href: "/dashboard/settings", label: "More", icon: <MoreIcon /> });

    return t;
  }, [business, isResourceManager, canPostJobs]);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/dashboard/settings") {
      return (
        pathname.startsWith("/dashboard/settings") ||
        pathname.startsWith("/dashboard/services") ||
        pathname.startsWith("/dashboard/customers") ||
        pathname.startsWith("/dashboard/messages")
      );
    }
    return pathname.startsWith(href);
  }

  const headerTitle = business ? business.name : "Resource Manager";

  return (
    <div className="max-w-[430px] mx-auto min-h-dvh relative bg-midnight">
      {/* Top Header */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-deep/95 backdrop-blur-md border-b border-border-subtle px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-gold to-gold-light rounded-lg flex items-center justify-center font-heading font-extrabold text-xs text-midnight">
              HC
            </div>
            <div>
              <h1 className="font-heading font-bold text-sm leading-tight truncate max-w-[200px]">
                {headerTitle}
              </h1>
              <p className="text-[10px] text-txt-secondary">Dashboard</p>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs text-txt-secondary hover:text-white transition-colors px-2 py-1"
          >
            View App
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-[68px] pb-[80px] overflow-y-auto overflow-x-hidden scrollbar-hide">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-deep/95 backdrop-blur-md border-t border-border-subtle px-2 pb-safe">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                  active ? "text-gold" : "text-txt-secondary hover:text-white"
                }`}
              >
                {tab.icon}
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
