"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ToastProvider from "@/components/ui/Toast";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

const navItems: { href: string; label: string; iconName: IconName }[] = [
  { href: "/admin", label: "Dashboard", iconName: "chart" },
  { href: "/admin/events", label: "Events", iconName: "calendar" },
  { href: "/admin/venues", label: "Venues", iconName: "building" },
  { href: "/admin/businesses", label: "Businesses", iconName: "store" },
  { href: "/admin/resources", label: "Resources", iconName: "lightbulb" },
  { href: "/admin/posts", label: "Posts", iconName: "megaphone" },
  { href: "/admin/issues", label: "City Issues", iconName: "wrench" },
  { href: "/admin/creators", label: "Creators", iconName: "film" },
  { href: "/admin/reports", label: "Reports", iconName: "flag" },
  { href: "/admin/data", label: "Data & Insights", iconName: "trending" },
  { href: "/admin/city-metrics", label: "City Metrics", iconName: "globe" },
  { href: "/admin/users", label: "Users", iconName: "users" },
  { href: "/admin/podcasts", label: "Podcasts", iconName: "podcast" },
  { href: "/admin/import", label: "Data Import", iconName: "upload" },
  { href: "/admin/notifications", label: "Notifications", iconName: "bell" },
];

export default function AdminNav({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-midnight flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border-subtle bg-deep p-5 shrink-0 hidden md:block">
        <Link href="/" className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-gold to-gold-light rounded-[10px] flex items-center justify-center font-heading font-extrabold text-[15px] text-midnight">
            HC
          </div>
          <span className="font-heading font-bold text-lg tracking-tight">
            K<span className="text-gold">nect</span>
          </span>
        </Link>

        <p className="text-[10px] text-txt-secondary uppercase tracking-widest font-semibold mb-3">
          Admin Panel
        </p>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-colors
                  ${active ? "bg-gold/10 text-gold" : "text-txt-secondary hover:text-white hover:bg-white/5"}
                `}
              >
                <Icon name={item.iconName} size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-txt-secondary hover:text-white hover:bg-white/5"
          >
            <Icon name="home" size={16} />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-deep border-b border-border-subtle px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-gold to-gold-light rounded-lg flex items-center justify-center font-heading font-extrabold text-xs text-midnight">
              HC
            </div>
            <span className="font-heading font-bold text-sm">
              Admin
            </span>
          </Link>
        </div>
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
                  ${active ? "bg-gold/10 text-gold" : "text-txt-secondary"}
                `}
              >
                <Icon name={item.iconName} size={16} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-5 md:p-8 pt-24 md:pt-8 overflow-y-auto">
        {children}
      </main>
      <ToastProvider />
    </div>
  );
}
