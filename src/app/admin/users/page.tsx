"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";

type BadgeVariant = "emerald" | "gold" | "purple" | "cyan" | "coral";

interface UserProfile {
  id: string;
  display_name: string;
  handle: string | null;
  role: string;
  district: number | null;
  verification_status: string;
  avatar_url: string | null;
  is_suspended: boolean;
  is_bot: boolean;
  created_at: string;
}

const roleVariant: Record<string, BadgeVariant> = {
  citizen: "cyan",
  business_owner: "purple",
  admin: "gold",
  city_official: "emerald",
};

const ROLES = ["citizen", "business_owner", "city_official", "admin"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        // Fallback: use supabase client-side
      }
      setLoading(false);
    }
    load();
  }, []);

  // Client-side fetch using supabase
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        // Use a simple fetch approach
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase
          .from("profiles")
          .select(
            "id, display_name, handle, role, district, verification_status, avatar_url, is_suspended, is_bot, created_at"
          )
          .order("created_at", { ascending: false });
        setUsers((data as UserProfile[]) ?? []);
      } catch {
        // fallback
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  async function handleRoleChange(userId: string, newRole: string) {
    setActionLoading(userId);
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });

    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } else {
      const data = await res.json();
      alert(data.error || "Failed to change role");
    }
    setActionLoading(null);
  }

  async function handleSuspend(userId: string, suspend: boolean) {
    setActionLoading(userId);
    const res = await fetch(`/api/admin/users/${userId}/suspend`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        suspended: suspend,
        reason: suspend ? "Suspended by admin" : undefined,
      }),
    });

    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_suspended: suspend } : u
        )
      );
    } else {
      const data = await res.json();
      alert(data.error || "Failed to update suspension");
    }
    setActionLoading(null);
  }

  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.display_name?.toLowerCase().includes(q) ||
        u.handle?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1">Users</h1>
        <p className="text-sm text-txt-secondary">
          {users.length} registered users · Manage roles and access
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
        />
      </div>

      {/* Role filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {["all", ...ROLES].map((r) => (
          <Chip
            key={r}
            label={r === "all" ? "All" : r.replace("_", " ")}
            active={roleFilter === r}
            onClick={() => setRoleFilter(r)}
          />
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="space-y-2">
        {!loading && filtered.length === 0 && (
          <Card>
            <p className="text-sm text-txt-secondary text-center py-4">
              No users found.
            </p>
          </Card>
        )}
        {filtered.map((user) => (
          <div key={user.id}>
            <Card
              hover
              className={`cursor-pointer ${user.is_suspended ? "opacity-60" : ""}`}
              onClick={() =>
                setExpandedUser(
                  expandedUser === user.id ? null : user.id
                )
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.display_name || "User"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-royal flex items-center justify-center text-gold font-heading font-bold text-sm">
                      {(user.display_name || "?")
                        .split(" ")
                        .map((w: string) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">
                        {user.display_name || "Unnamed User"}
                      </p>
                      {user.is_bot && (
                        <Badge label="BOT" variant="cyan" />
                      )}
                      {user.is_suspended && (
                        <Badge label="SUSPENDED" variant="coral" />
                      )}
                    </div>
                    <p className="text-xs text-txt-secondary">
                      {user.handle
                        ? `@${user.handle}`
                        : `Joined ${new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    label={(user.role || "citizen").replace("_", " ")}
                    variant={roleVariant[user.role || "citizen"] || "cyan"}
                  />
                  {user.district && (
                    <Badge label={`D${user.district}`} variant="cyan" />
                  )}
                </div>
              </div>
            </Card>

            {/* Expanded actions */}
            {expandedUser === user.id && !user.is_bot && (
              <div className="mt-1 mb-3 ml-4 p-4 rounded-xl bg-card border border-border-subtle">
                <div className="space-y-3">
                  {/* Role Change */}
                  <div>
                    <p className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-2">
                      Change Role
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {ROLES.map((r) => (
                        <button
                          key={r}
                          disabled={
                            user.role === r ||
                            actionLoading === user.id
                          }
                          onClick={() => handleRoleChange(user.id, r)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            user.role === r
                              ? "bg-gold/20 text-gold border border-gold/40"
                              : "bg-white/5 border border-border-subtle text-txt-secondary hover:border-gold/20 hover:text-white"
                          } disabled:opacity-40`}
                        >
                          {r.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Suspend/Unsuspend */}
                  <div className="pt-2 border-t border-border-subtle">
                    {user.is_suspended ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={actionLoading === user.id}
                        onClick={() => handleSuspend(user.id, false)}
                      >
                        Unsuspend User
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="danger"
                        loading={actionLoading === user.id}
                        onClick={() => handleSuspend(user.id, true)}
                      >
                        Suspend User
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
