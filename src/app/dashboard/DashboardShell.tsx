"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, useEffect, useCallback } from "react";
import type { Business, Resource } from "@/types/database";

interface TabDef {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface TabSection {
  title: string;
  tabs: TabDef[];
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

function ChamberIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function ServicesIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function CustomersIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isResourceManager = userRole === "city_official" || userRole === "admin" || userRole === "resource_provider";
  const isChamberAdmin = userRole === "chamber_admin" || userRole === "admin";
  const isBusinessOwner = userRole === "business_owner";
  const canPostJobs = ["business_owner", "admin", "city_official", "city_ambassador"].includes(userRole);

  // Build flat tabs list (used for active tab detection)
  const allTabs: TabDef[] = useMemo(() => {
    const t: TabDef[] = [];
    const bizType = business?.business_type;

    t.push({ href: "/dashboard", label: "Overview", icon: <OverviewIcon /> });

    if (business) {
      if (bizType === "food") {
        t.push({ href: "/dashboard/orders", label: "Orders", icon: <OrdersIcon /> });
        t.push({ href: "/dashboard/menu", label: "Menu", icon: <MenuIcon /> });
        t.push({ href: "/dashboard/specials", label: "Specials", icon: <SpecialsIcon /> });
        if (business.is_mobile_vendor || business.business_sub_type === "food_truck" || business.business_sub_type === "cart") {
          t.push({ href: "/dashboard/location", label: "Location", icon: <LocationIcon /> });
        }
      } else if (bizType === "retail") {
        t.push({ href: "/dashboard/orders", label: "Orders", icon: <OrdersIcon /> });
        t.push({ href: "/dashboard/menu", label: "Catalog", icon: <MenuIcon /> });
        t.push({ href: "/dashboard/coupons", label: "Coupons", icon: <SpecialsIcon /> });
      } else if (bizType === "service") {
        t.push({ href: "/dashboard/bookings", label: "Bookings", icon: <BookingsIcon /> });
      } else {
        t.push({ href: "/dashboard/orders", label: "Orders", icon: <OrdersIcon /> });
        t.push({ href: "/dashboard/menu", label: "Menu", icon: <MenuIcon /> });
        t.push({ href: "/dashboard/bookings", label: "Bookings", icon: <BookingsIcon /> });
        t.push({ href: "/dashboard/specials", label: "Specials", icon: <SpecialsIcon /> });
        if (business.is_mobile_vendor) {
          t.push({ href: "/dashboard/location", label: "Location", icon: <LocationIcon /> });
        }
      }
      t.push({ href: "/dashboard/analytics", label: "Analytics", icon: <AnalyticsIcon /> });
    }

    if (canPostJobs) {
      t.push({ href: "/dashboard/jobs", label: "Jobs", icon: <JobsIcon /> });
    }

    if (isResourceManager) {
      t.push({ href: "/dashboard/polls", label: "Polls", icon: <PollsIcon /> });
      t.push({ href: "/dashboard/surveys", label: "Surveys", icon: <ApplicationsIcon /> });
      t.push({ href: "/dashboard/applications", label: "Apps", icon: <ResourcesIcon /> });
      t.push({ href: "/dashboard/resources", label: "Resources", icon: <ResourcesIcon /> });
    }

    if (isBusinessOwner) {
      t.push({ href: "/dashboard/chamber-hub", label: "Chamber", icon: <ChamberIcon /> });
    }

    if (isChamberAdmin) {
      t.push({ href: "/dashboard/chamber", label: "Chamber Admin", icon: <ChamberIcon /> });
    }

    t.push({ href: "/dashboard/settings", label: "Settings", icon: <SettingsIcon /> });

    return t;
  }, [business, isResourceManager, isChamberAdmin, isBusinessOwner, canPostJobs]);

  // Build grouped sections for the drawer
  const sections: TabSection[] = useMemo(() => {
    const s: TabSection[] = [];
    const bizType = business?.business_type;

    // Main section
    const mainTabs: TabDef[] = [
      { href: "/dashboard", label: "Overview", icon: <OverviewIcon /> },
    ];
    if (business) {
      if (bizType === "food") {
        mainTabs.push({ href: "/dashboard/orders", label: "Orders", icon: <OrdersIcon /> });
        mainTabs.push({ href: "/dashboard/menu", label: "Menu", icon: <MenuIcon /> });
      } else if (bizType === "retail") {
        mainTabs.push({ href: "/dashboard/orders", label: "Orders", icon: <OrdersIcon /> });
        mainTabs.push({ href: "/dashboard/menu", label: "Catalog", icon: <MenuIcon /> });
      } else if (bizType === "service") {
        mainTabs.push({ href: "/dashboard/bookings", label: "Bookings", icon: <BookingsIcon /> });
      } else {
        mainTabs.push({ href: "/dashboard/orders", label: "Orders", icon: <OrdersIcon /> });
        mainTabs.push({ href: "/dashboard/menu", label: "Menu", icon: <MenuIcon /> });
        mainTabs.push({ href: "/dashboard/bookings", label: "Bookings", icon: <BookingsIcon /> });
      }
    }
    s.push({ title: "Main", tabs: mainTabs });

    // Marketing section
    if (business) {
      const marketingTabs: TabDef[] = [];
      if (bizType === "food") {
        marketingTabs.push({ href: "/dashboard/specials", label: "Specials", icon: <SpecialsIcon /> });
      } else if (bizType === "retail") {
        marketingTabs.push({ href: "/dashboard/coupons", label: "Coupons", icon: <SpecialsIcon /> });
      } else if (bizType !== "service") {
        marketingTabs.push({ href: "/dashboard/specials", label: "Specials", icon: <SpecialsIcon /> });
      }
      marketingTabs.push({ href: "/dashboard/analytics", label: "Analytics", icon: <AnalyticsIcon /> });
      if (marketingTabs.length > 0) {
        s.push({ title: "Marketing", tabs: marketingTabs });
      }
    }

    // Manage section
    const manageTabs: TabDef[] = [];
    if (business) {
      if (bizType === "service" || !bizType || bizType === "food" || bizType === "retail") {
        manageTabs.push({ href: "/dashboard/services", label: "Services & Staff", icon: <ServicesIcon /> });
      }
      manageTabs.push({ href: "/dashboard/customers", label: "Customers", icon: <CustomersIcon /> });
    }
    if (canPostJobs) {
      manageTabs.push({ href: "/dashboard/jobs", label: "Jobs", icon: <JobsIcon /> });
    }
    if (business && (business.is_mobile_vendor || business.business_sub_type === "food_truck" || business.business_sub_type === "cart")) {
      manageTabs.push({ href: "/dashboard/location", label: "Location", icon: <LocationIcon /> });
    }
    if (manageTabs.length > 0) {
      s.push({ title: "Manage", tabs: manageTabs });
    }

    // Admin section (officials)
    if (isResourceManager) {
      s.push({
        title: "Admin",
        tabs: [
          { href: "/dashboard/polls", label: "Polls", icon: <PollsIcon /> },
          { href: "/dashboard/surveys", label: "Surveys", icon: <ApplicationsIcon /> },
          { href: "/dashboard/applications", label: "Applications", icon: <ResourcesIcon /> },
          { href: "/dashboard/resources", label: "Resources", icon: <ResourcesIcon /> },
        ],
      });
    }

    // Chamber Hub (business owners)
    if (isBusinessOwner) {
      s.push({
        title: "Chamber",
        tabs: [
          { href: "/dashboard/chamber-hub", label: "Chamber Hub", icon: <ChamberIcon /> },
        ],
      });
    }

    // Chamber Admin section
    if (isChamberAdmin) {
      s.push({
        title: "Chamber Admin",
        tabs: [
          { href: "/dashboard/chamber", label: "Chamber Mgmt", icon: <ChamberIcon /> },
        ],
      });
    }

    return s;
  }, [business, isResourceManager, isChamberAdmin, isBusinessOwner, canPostJobs]);

  // Settings tab (always at bottom, separate from sections)
  const settingsTab: TabDef = { href: "/dashboard/settings", label: "Settings", icon: <SettingsIcon /> };

  // Bottom tab bar — core 3-4 tabs always visible
  const bottomTabs: TabDef[] = useMemo(() => {
    const bizType = business?.business_type;
    const tabs: TabDef[] = [
      { href: "/dashboard", label: "Overview", icon: <OverviewIcon /> },
    ];

    if (business) {
      if (bizType === "food" || bizType === "retail") {
        tabs.push({ href: "/dashboard/orders", label: "Orders", icon: <OrdersIcon /> });
        tabs.push({ href: "/dashboard/menu", label: bizType === "retail" ? "Catalog" : "Menu", icon: <MenuIcon /> });
      } else if (bizType === "service") {
        tabs.push({ href: "/dashboard/bookings", label: "Bookings", icon: <BookingsIcon /> });
      } else {
        tabs.push({ href: "/dashboard/orders", label: "Orders", icon: <OrdersIcon /> });
        tabs.push({ href: "/dashboard/bookings", label: "Bookings", icon: <BookingsIcon /> });
      }
    }

    if (canPostJobs && !business) {
      tabs.push({ href: "/dashboard/jobs", label: "Jobs", icon: <JobsIcon /> });
    }

    if (isBusinessOwner) {
      tabs.push({ href: "/dashboard/chamber-hub", label: "Chamber", icon: <ChamberIcon /> });
    }

    tabs.push({ href: "/dashboard/settings", label: "Settings", icon: <SettingsIcon /> });

    return tabs;
  }, [business, canPostJobs, isBusinessOwner]);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/dashboard/chamber-hub") {
      return pathname.startsWith("/dashboard/chamber-hub");
    }
    if (href === "/dashboard/chamber") {
      return pathname === "/dashboard/chamber" || (pathname.startsWith("/dashboard/chamber") && !pathname.startsWith("/dashboard/chamber-hub"));
    }
    if (href === "/dashboard/services") {
      return pathname.startsWith("/dashboard/services");
    }
    if (href === "/dashboard/customers") {
      return pathname.startsWith("/dashboard/customers");
    }
    if (href === "/dashboard/settings") {
      return (
        pathname.startsWith("/dashboard/settings") ||
        pathname.startsWith("/dashboard/messages") ||
        pathname.startsWith("/dashboard/inventory") ||
        pathname.startsWith("/dashboard/loyalty")
      );
    }
    return pathname.startsWith(href);
  }

  // Find the active tab label for the header
  const activeTabLabel = useMemo(() => {
    const active = allTabs.find((tab) => isActive(tab.href));
    return active?.label ?? "Overview";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, allTabs]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Close drawer on Escape key
  useEffect(() => {
    if (!drawerOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [drawerOpen]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const headerTitle = business ? business.name : isChamberAdmin ? "Chamber of Commerce" : isResourceManager ? "Resource Manager" : "Dashboard";

  return (
    <div className="max-w-[430px] mx-auto min-h-dvh relative bg-midnight">
      {/* Top Header */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-30 bg-deep/95 backdrop-blur-md border-b border-border-subtle px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-gold to-gold-light rounded-lg flex items-center justify-center font-heading font-extrabold text-xs text-midnight">
              K
            </div>
            <div>
              <h1 className="font-heading font-bold text-sm leading-tight truncate max-w-[200px]">
                {headerTitle}
              </h1>
              <p className="text-[10px] text-gold/80 font-medium">{activeTabLabel}</p>
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
      <main className="pt-[60px] pb-[72px] overflow-y-auto overflow-x-hidden scrollbar-hide">
        {children}
      </main>

      {/* Drawer Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 transition-opacity"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Navigation Drawer */}
      <nav
        className={`fixed top-0 left-0 bottom-0 w-64 z-50 glass-card-elevated border-r border-border-subtle transform transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-gold to-gold-light rounded-lg flex items-center justify-center font-heading font-extrabold text-[10px] text-midnight">
              K
            </div>
            <span className="font-heading font-bold text-sm text-white truncate max-w-[140px]">
              {headerTitle}
            </span>
          </div>
          <button
            onClick={closeDrawer}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-txt-secondary hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close navigation"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-3 px-3 h-[calc(100dvh-120px)] scrollbar-hide">
          {sections.map((section) => (
            <div key={section.title} className="mb-3">
              <p className="text-[10px] font-semibold text-txt-secondary uppercase tracking-wider px-2 mb-1">
                {section.title}
              </p>
              {section.tabs.map((tab) => {
                const active = isActive(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    onClick={closeDrawer}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors mb-0.5 ${
                      active
                        ? "bg-gold/15 text-gold"
                        : "text-txt-secondary hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {tab.icon}
                    <span className="text-sm font-medium">{tab.label}</span>
                    {active && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          {/* Divider before Settings */}
          <div className="border-t border-border-subtle my-3" />

          {/* Settings tab */}
          <Link
            href={settingsTab.href}
            onClick={closeDrawer}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              isActive(settingsTab.href)
                ? "bg-gold/15 text-gold"
                : "text-txt-secondary hover:text-white hover:bg-white/5"
            }`}
          >
            {settingsTab.icon}
            <span className="text-sm font-medium">{settingsTab.label}</span>
            {isActive(settingsTab.href) && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />
            )}
          </Link>
        </div>
      </nav>

      {/* Bottom Tab Bar */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-30 bg-deep/95 backdrop-blur-md border-t border-border-subtle"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-around h-[56px]">
          {bottomTabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                  active ? "text-gold" : "text-txt-secondary"
                }`}
              >
                {tab.icon}
                <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setDrawerOpen((prev) => !prev)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-txt-secondary transition-colors"
            aria-label="More navigation options"
          >
            <MoreIcon />
            <span className="text-[10px] font-medium leading-tight">More</span>
          </button>
        </div>
      </div>
    </div>
  );
}
