"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

/* ── Service grid items ── */
const serviceItems: { href: string; label: string; iconName: IconName }[] = [
  { href: "/events", label: "Events", iconName: "calendar" },
  { href: "/food", label: "Food", iconName: "utensils" },
  { href: "/business", label: "Business", iconName: "briefcase" },
  { href: "/city-hall", label: "City Hall", iconName: "landmark" },
  { href: "/health", label: "Health", iconName: "heart-pulse" },
  { href: "/schools", label: "Schools", iconName: "graduation" },
  { href: "/culture", label: "Culture", iconName: "palette" },
  { href: "/parks", label: "Parks", iconName: "tree" },

  { href: "/jobs", label: "Jobs", iconName: "briefcase" },
  { href: "/groups", label: "Groups", iconName: "users" },
  { href: "/people", label: "People", iconName: "person" },
  { href: "/resources", label: "Resources", iconName: "book" },
  { href: "/officials", label: "Officials", iconName: "gavel" },
  { href: "/district", label: "District", iconName: "grid" },
  { href: "/live", label: "Hub TV", iconName: "film" },
];

/* ── Nav tab icons ── */
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      {!active && <polyline points="9 22 9 12 15 12 15 22" />}
    </svg>
  );
}

function PulseIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" fill={active ? "currentColor" : "none"} />
      <path d="M5.6 5.6a9 9 0 0 1 12.8 0" opacity={active ? 1 : 0.7} />
      <path d="M7.8 7.8a5.5 5.5 0 0 1 8.4 0" />
      <path d="M18.4 18.4a9 9 0 0 1-12.8 0" opacity={active ? 1 : 0.7} />
      <path d="M16.2 16.2a5.5 5.5 0 0 1-8.4 0" />
    </svg>
  );
}

function LiveIcon({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function ServicesIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "2"} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" fill={active ? "currentColor" : "none"} />
      <rect x="14" y="3" width="7" height="7" rx="1.5" fill={active ? "currentColor" : "none"} />
      <rect x="3" y="14" width="7" height="7" rx="1.5" fill={active ? "currentColor" : "none"} />
      <rect x="14" y="14" width="7" height="7" rx="1.5" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-2a6 6 0 0112 0v2" />
    </svg>
  );
}

/* ── Main component ── */
export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [servicesOpen, setServicesOpen] = useState(false);

  // Close services sheet on route change
  useEffect(() => {
    setServicesOpen(false);
  }, [pathname]);

  // Close on escape key
  useEffect(() => {
    if (!servicesOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setServicesOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [servicesOpen]);

  const isActive = useCallback(
    (href: string) => {
      if (href === "/") return pathname === "/";
      return pathname.startsWith(href);
    },
    [pathname]
  );

  // Check if any service route is active (to highlight Services tab)
  const serviceRoutes = serviceItems.map((s) => s.href);
  const isServiceRouteActive = serviceRoutes.some((r) => pathname.startsWith(r));

  const handleServiceNav = (href: string) => {
    setServicesOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* ── Services Sheet Overlay ── */}
      <div
        className={`fixed inset-0 z-[190] transition-all duration-300 ${
          servicesOpen ? "visible" : "invisible pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
            servicesOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setServicesOpen(false)}
        />

        {/* Sheet */}
        <div
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 max-w-[430px] w-full transition-transform duration-300 ease-out ${
            servicesOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="glass-card-elevated rounded-t-3xl px-5 pt-6 pb-28">
            {/* Handle */}
            <div className="flex justify-center mb-5">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <h2 className="text-white font-heading font-semibold text-base mb-5 px-1">Services</h2>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-3">
              {serviceItems.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <button
                    key={item.href}
                    onClick={() => handleServiceNav(item.href)}
                    className={`flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl transition-all duration-200 active:scale-95 ${
                      active
                        ? "glass-chip-active text-[#F2A900]"
                        : "glass-surface text-white/70 hover:text-white"
                    }`}
                    aria-label={`Go to ${item.label}`}
                  >
                    <Icon name={item.iconName} size={24} className={active ? "text-[#F2A900]" : "text-white/70"} />
                    <span className={`text-xs font-medium ${active ? "text-[#F2A900]" : ""}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Navigation Bar ── */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-[430px] w-full z-[200]">
        {/* Gradient fade above nav */}
        <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none" />

        <div
          className="bg-[#0A0A0A]/95 backdrop-blur-lg border-t border-white/[0.06] flex items-center justify-around px-1 pb-[env(safe-area-inset-bottom,0px)]"
          style={{ height: "76px" }}
        >
          {/* Home */}
          <NavTab
            href="/"
            label="Home"
            active={isActive("/")}
            icon={(a) => <HomeIcon active={a} />}
          />

          {/* Pulse */}
          <NavTab
            href="/pulse"
            label="Pulse"
            active={isActive("/pulse")}
            icon={(a) => <PulseIcon active={a} />}
          />

          {/* Services — center prominent */}
          <button
            onClick={() => setServicesOpen((prev) => !prev)}
            aria-label="Services"
            aria-expanded={servicesOpen}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl relative transition-all duration-200 active:scale-95 ${
              servicesOpen || isServiceRouteActive
                ? "text-[#F2A900]"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {(servicesOpen || isServiceRouteActive) && (
              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-[#F2A900]" />
            )}
            <div
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                (servicesOpen || isServiceRouteActive)
                  ? "bg-[#F2A900]/15"
                  : "bg-white/[0.06]"
              }`}
            >
              <ServicesIcon active={servicesOpen || isServiceRouteActive} />
            </div>
            <span
              className={`text-[10px] font-semibold transition-colors ${
                (servicesOpen || isServiceRouteActive) ? "text-[#F2A900]" : ""
              }`}
            >
              Services
            </span>
          </button>

          {/* Live */}
          <Link
            href="/live"
            aria-label="Live"
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-2xl relative transition-all duration-200 active:scale-95 ${
              isActive("/live") ? "text-[#F2A900]" : "text-white/50 hover:text-white/80"
            }`}
          >
            {isActive("/live") && (
              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-[#F2A900]" />
            )}
            <div
              className={`relative transition-all duration-200 ${
                isActive("/live") ? "scale-110" : ""
              }`}
            >
              <LiveIcon active={isActive("/live")} />
              {/* Red dot — live indicator */}
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FF6B6B] shadow-[0_0_6px_rgba(255,107,107,0.6)]" />
            </div>
            <span
              className={`text-[10px] font-medium transition-colors ${
                isActive("/live") ? "text-[#F2A900] font-semibold" : ""
              }`}
            >
              Live
            </span>
          </Link>

          {/* Me */}
          <NavTab
            href="/profile"
            label="Me"
            active={isActive("/profile")}
            icon={(a) => <ProfileIcon active={a} />}
          />
        </div>
      </nav>
    </>
  );
}

/* ── Reusable tab link ── */
function NavTab({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: (active: boolean) => React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`flex flex-col items-center gap-1 py-2 px-3 rounded-2xl relative transition-all duration-200 active:scale-95 ${
        active ? "text-[#F2A900]" : "text-white/50 hover:text-white/80"
      }`}
    >
      {active && (
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-[#F2A900]" />
      )}
      <div className={`transition-all duration-200 ${active ? "scale-110" : ""}`}>
        {active && (
          <div className="absolute inset-0 -m-1 rounded-xl bg-[#F2A900]/10 pointer-events-none" />
        )}
        {icon(active)}
      </div>
      <span
        className={`text-[10px] font-medium transition-colors ${
          active ? "text-[#F2A900] font-semibold" : ""
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
