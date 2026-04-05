"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/* ── Service grid items ── */
const serviceItems = [
  { href: "/events", label: "Events", icon: "calendar" },
  { href: "/food", label: "Food", icon: "utensils" },
  { href: "/business", label: "Business", icon: "briefcase" },
  { href: "/city-hall", label: "City Hall", icon: "landmark" },
  { href: "/health", label: "Health", icon: "heart-pulse" },
  { href: "/schools", label: "Schools", icon: "graduation" },
  { href: "/culture", label: "Culture", icon: "palette" },
  { href: "/parks", label: "Parks", icon: "tree" },
  { href: "/map", label: "Map", icon: "map-pin" },
  { href: "/jobs", label: "Jobs", icon: "search" },
  { href: "/groups", label: "Groups", icon: "users" },
  { href: "/people", label: "People", icon: "people" },
  { href: "/resources", label: "Resources", icon: "book" },
  { href: "/district", label: "District", icon: "grid" },
];

/* ── Inline SVG icons for the service grid ── */
function ServiceIcon({ type }: { type: string }) {
  const props = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "calendar":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "utensils":
      return (
        <svg {...props}>
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
          <path d="M7 2v20" />
          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
        </svg>
      );
    case "briefcase":
      return (
        <svg {...props}>
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        </svg>
      );
    case "landmark":
      return (
        <svg {...props}>
          <line x1="3" y1="22" x2="21" y2="22" />
          <line x1="6" y1="18" x2="6" y2="11" />
          <line x1="10" y1="18" x2="10" y2="11" />
          <line x1="14" y1="18" x2="14" y2="11" />
          <line x1="18" y1="18" x2="18" y2="11" />
          <polygon points="12 2 20 7 4 7" />
          <line x1="2" y1="18" x2="22" y2="18" />
        </svg>
      );
    case "heart-pulse":
      return (
        <svg {...props}>
          <path d="M19.5 12.6l-7.5 7.4-7.5-7.4A5 5 0 0 1 12 5.1a5 5 0 0 1 7.5 7.5z" />
          <path d="M3.5 12h3l2 -3 3 6 2 -3h3" />
        </svg>
      );
    case "graduation":
      return (
        <svg {...props}>
          <path d="M22 10l-10-5L2 10l10 5 10-5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
          <line x1="22" y1="10" x2="22" y2="16" />
        </svg>
      );
    case "palette":
      return (
        <svg {...props}>
          <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
          <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
          <circle cx="6.5" cy="12" r="0.5" fill="currentColor" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.7 1.5-1.5 0-.4-.1-.7-.4-1-.3-.3-.4-.7-.4-1.1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-5.2-4.5-9-10-9z" />
        </svg>
      );
    case "tree":
      return (
        <svg {...props}>
          <path d="M12 22V13" />
          <path d="M5.5 13h13L12 3 5.5 13z" />
          <path d="M7 13l5 -6.5L17 13" />
        </svg>
      );
    case "map-pin":
      return (
        <svg {...props}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case "search":
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <path d="M11 8v6M8 11h6" />
        </svg>
      );
    case "users":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "people":
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "book":
      return (
        <svg {...props}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z" />
        </svg>
      );
    case "grid":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    default:
      return null;
  }
}

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
          <div className="bg-[#111111] border-t border-white/[0.08] rounded-t-3xl px-5 pt-6 pb-28">
            {/* Handle */}
            <div className="flex justify-center mb-5">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <h2 className="text-white font-semibold text-base mb-5 px-1">Services</h2>

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
                        ? "bg-[#F2A900]/10 text-[#F2A900]"
                        : "bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
                    }`}
                    aria-label={`Go to ${item.label}`}
                  >
                    <ServiceIcon type={item.icon} />
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

          {/* Live — center prominent */}
          <Link
            href="/live"
            aria-label="Live"
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl relative transition-all duration-200 active:scale-95 ${
              isActive("/live") ? "text-[#F2A900]" : "text-white/50 hover:text-white/80"
            }`}
          >
            {isActive("/live") && (
              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-[#F2A900]" />
            )}
            <div
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                isActive("/live")
                  ? "bg-[#F2A900]/15"
                  : "bg-white/[0.06]"
              }`}
            >
              <LiveIcon active={isActive("/live")} />
              {/* Red dot — live indicator */}
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF6B6B] shadow-[0_0_6px_rgba(255,107,107,0.6)]" />
            </div>
            <span
              className={`text-[10px] font-semibold transition-colors ${
                isActive("/live") ? "text-[#F2A900]" : ""
              }`}
            >
              Live
            </span>
          </Link>

          {/* Services */}
          <button
            onClick={() => setServicesOpen((prev) => !prev)}
            aria-label="Services"
            aria-expanded={servicesOpen}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-2xl relative transition-all duration-200 active:scale-95 ${
              servicesOpen || isServiceRouteActive
                ? "text-[#F2A900]"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {(servicesOpen || isServiceRouteActive) && (
              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-[#F2A900]" />
            )}
            <div
              className={`transition-transform duration-200 ${
                (servicesOpen || isServiceRouteActive) ? "scale-110" : ""
              }`}
            >
              <ServicesIcon active={servicesOpen || isServiceRouteActive} />
            </div>
            <span
              className={`text-[10px] font-medium transition-colors ${
                (servicesOpen || isServiceRouteActive) ? "text-[#F2A900] font-semibold" : ""
              }`}
            >
              Services
            </span>
          </button>

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
