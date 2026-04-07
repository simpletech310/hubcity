"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import type { Service } from "@/types/database";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  specialties: string[];
  is_active: boolean;
  staff_services: { service_id: string }[];
}

interface StaffManagerProps {
  businessId: string;
  services: Service[];
}

export default function StaffManager({ businessId, services }: StaffManagerProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [role, setRole] = useState("provider");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/staff?business_id=${businessId}`)
      .then((r) => r.json())
      .then((d) => setStaff(d.staff ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [businessId]);

  function resetForm() {
    setName("");
    setRole("provider");
    setEmail("");
    setPhone("");
    setSelectedServices([]);
    setShowForm(false);
    setEditingId(null);
  }

  function startEdit(s: StaffMember) {
    setName(s.name);
    setRole(s.role);
    setEmail(s.email || "");
    setPhone(s.phone || "");
    setSelectedServices(s.staff_services.map((ss) => ss.service_id));
    setEditingId(s.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);

    try {
      if (editingId) {
        const res = await fetch(`/api/staff/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            role,
            email: email.trim() || null,
            phone: phone.trim() || null,
            service_ids: selectedServices,
          }),
        });
        if (res.ok) {
          const { staff: updated } = await res.json();
          setStaff((prev) =>
            prev.map((s) =>
              s.id === editingId
                ? { ...updated, staff_services: selectedServices.map((sid) => ({ service_id: sid })) }
                : s
            )
          );
        }
      } else {
        const res = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            business_id: businessId,
            name: name.trim(),
            role,
            email: email.trim() || null,
            phone: phone.trim() || null,
            service_ids: selectedServices,
          }),
        });
        if (res.ok) {
          const { staff: created } = await res.json();
          setStaff((prev) => [
            ...prev,
            { ...created, staff_services: selectedServices.map((sid) => ({ service_id: sid })) },
          ]);
        }
      }
      resetForm();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this team member?")) return;
    const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
    if (res.ok) setStaff((prev) => prev.filter((s) => s.id !== id));
  }

  async function toggleActive(s: StaffMember) {
    const res = await fetch(`/api/staff/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !s.is_active }),
    });
    if (res.ok) {
      setStaff((prev) =>
        prev.map((st) => (st.id === s.id ? { ...st, is_active: !st.is_active } : st))
      );
    }
  }

  function toggleService(serviceId: string) {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Staff List */}
      {staff.length === 0 && !showForm && (
        <Card className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gold">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="text-sm font-medium mb-1">No team members yet</p>
          <p className="text-xs text-txt-secondary">
            Add your staff so customers know who provides each service
          </p>
        </Card>
      )}

      {staff.map((s) => (
        <Card key={s.id}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0 text-gold font-bold text-sm">
                {s.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{s.name}</p>
                  {!s.is_active && <Badge label="Inactive" variant="coral" size="sm" />}
                </div>
                <p className="text-xs text-txt-secondary capitalize">{s.role}</p>
                {s.staff_services.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {s.staff_services.map((ss) => {
                      const svc = services.find((sv) => sv.id === ss.service_id);
                      return svc ? (
                        <span key={ss.service_id} className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded-full">
                          {svc.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => toggleActive(s)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title={s.is_active ? "Deactivate" : "Activate"}
              >
                <svg width="14" height="14" fill="none" stroke={s.is_active ? "#10B981" : "#6B7280"} strokeWidth="2" strokeLinecap="round">
                  {s.is_active ? (
                    <path d="M1 7l4 4L13 3" />
                  ) : (
                    <path d="M3 3l8 8M11 3l-8 8" />
                  )}
                </svg>
              </button>
              <button
                onClick={() => startEdit(s)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M10 2l2 2L5 11H3V9z" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(s.id)}
                className="p-1.5 rounded-lg hover:bg-coral/10 transition-colors text-txt-secondary hover:text-coral"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M2 4h10M5 4V2h4v2M4 4v8h6V4" />
                </svg>
              </button>
            </div>
          </div>
        </Card>
      ))}

      {/* Add/Edit Form */}
      {showForm ? (
        <Card className="border-gold/20">
          <h3 className="text-sm font-bold mb-3">
            {editingId ? "Edit Team Member" : "Add Team Member"}
          </h3>
          <div className="space-y-3">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah Johnson" />
            <div>
              <label className="block text-xs font-medium text-txt-secondary mb-1.5">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-card border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gold/40"
              >
                <option value="provider">Service Provider</option>
                <option value="stylist">Stylist</option>
                <option value="barber">Barber</option>
                <option value="technician">Technician</option>
                <option value="therapist">Therapist</option>
                <option value="trainer">Trainer</option>
                <option value="manager">Manager</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input label="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@example.com" type="email" />
            <Input label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(310) 555-0123" type="tel" />

            {services.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-txt-secondary mb-1.5">Services Provided</label>
                <div className="flex flex-wrap gap-2">
                  {services.map((svc) => (
                    <button
                      key={svc.id}
                      onClick={() => toggleService(svc.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedServices.includes(svc.id)
                          ? "bg-gold/15 text-gold border border-gold/30"
                          : "bg-white/5 text-txt-secondary border border-border-subtle"
                      }`}
                    >
                      {svc.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button onClick={handleSave} loading={saving} disabled={!name.trim()}>
                {editingId ? "Save Changes" : "Add Member"}
              </Button>
              <Button variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 rounded-xl border border-dashed border-border-subtle text-sm font-semibold text-txt-secondary hover:text-gold hover:border-gold/30 transition-all"
        >
          + Add Team Member
        </button>
      )}
    </div>
  );
}
