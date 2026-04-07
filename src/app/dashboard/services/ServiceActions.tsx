"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import type { Service } from "@/types/database";

interface ServiceFormData {
  name: string;
  description: string;
  priceDisplay: string;
  duration: string;
  depositDisplay: string;
  leadTimeHours: string;
  isAvailable: boolean;
}

function ServiceForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  error,
  submitLabel,
}: {
  initial: ServiceFormData;
  onSubmit: (data: ServiceFormData) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
  submitLabel: string;
}) {
  const [form, setForm] = useState<ServiceFormData>(initial);

  function update(field: keyof ServiceFormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-3"
    >
      <Input
        label="Name"
        placeholder="e.g. Haircut"
        value={form.name}
        onChange={(e) => update("name", e.target.value)}
        required
      />
      <Input
        label="Description (optional)"
        placeholder="Describe the service..."
        value={form.description}
        onChange={(e) => update("description", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Price ($)"
          placeholder="25.00"
          type="number"
          step="0.01"
          min="0"
          value={form.priceDisplay}
          onChange={(e) => update("priceDisplay", e.target.value)}
          required
        />
        <Input
          label="Duration (min)"
          placeholder="30"
          type="number"
          min="5"
          value={form.duration}
          onChange={(e) => update("duration", e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Deposit ($)"
          placeholder="0.00"
          type="number"
          step="0.01"
          min="0"
          value={form.depositDisplay}
          onChange={(e) => update("depositDisplay", e.target.value)}
        />
        <Input
          label="Lead Time (hrs)"
          placeholder="1"
          type="number"
          min="0"
          value={form.leadTimeHours}
          onChange={(e) => update("leadTimeHours", e.target.value)}
        />
      </div>
      <p className="text-[10px] text-txt-secondary -mt-1">
        Deposit collected at booking ($0 = no deposit). Lead time = minimum hours in advance to book.
      </p>

      {/* Available toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isAvailable}
          onChange={(e) => update("isAvailable", e.target.checked)}
          className="w-4 h-4 rounded border-border-subtle accent-gold"
        />
        <span className="text-sm text-txt-secondary">Available for booking</span>
      </label>

      {error && <p className="text-xs text-coral">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" loading={loading} size="sm" className="flex-1">
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function ServiceActions({
  service,
  businessId,
  isAddButton,
}: {
  service?: Service;
  businessId: string;
  isAddButton?: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleDelete() {
    if (!service) return;
    if (!confirm("Delete this service?")) return;
    setLoading(true);
    try {
      await fetch(`/api/services/${service.id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(form: ServiceFormData) {
    const dollars = parseFloat(form.priceDisplay);
    const deposit = parseFloat(form.depositDisplay) || 0;
    if (!form.name.trim() || isNaN(dollars) || !form.duration) {
      setError("Name, price, and duration are required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: Math.round(dollars * 100),
          duration: parseInt(form.duration),
          deposit_amount: Math.round(deposit * 100),
          lead_time_hours: parseInt(form.leadTimeHours) || 1,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add service");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(form: ServiceFormData) {
    if (!service) return;
    const dollars = parseFloat(form.priceDisplay);
    const deposit = parseFloat(form.depositDisplay) || 0;
    if (!form.name.trim() || isNaN(dollars) || !form.duration) {
      setError("Name, price, and duration are required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: Math.round(dollars * 100),
          duration: parseInt(form.duration),
          deposit_amount: Math.round(deposit * 100),
          lead_time_hours: parseInt(form.leadTimeHours) || 1,
          is_available: form.isAvailable,
        }),
      });

      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update service");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Add button mode
  if (isAddButton) {
    return (
      <>
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} fullWidth variant="outline">
            + Add Service
          </Button>
        ) : (
          <Card>
            <h3 className="text-sm font-semibold mb-3">New Service</h3>
            <ServiceForm
              initial={{
                name: "",
                description: "",
                priceDisplay: "",
                duration: "",
                depositDisplay: "",
                leadTimeHours: "1",
                isAvailable: true,
              }}
              onSubmit={handleAdd}
              onCancel={() => setShowForm(false)}
              loading={loading}
              error={error}
              submitLabel="Save"
            />
          </Card>
        )}
      </>
    );
  }

  // Edit mode for existing service
  if (editing && service) {
    return (
      <Card className="mt-2">
        <h3 className="text-sm font-semibold mb-3">Edit Service</h3>
        <ServiceForm
          initial={{
            name: service.name,
            description: service.description || "",
            priceDisplay: (service.price / 100).toFixed(2),
            duration: String(service.duration),
            depositDisplay: ((service.deposit_amount ?? 0) / 100).toFixed(2),
            leadTimeHours: String(service.lead_time_hours ?? 1),
            isAvailable: service.is_available,
          }}
          onSubmit={handleEdit}
          onCancel={() => {
            setEditing(false);
            setError("");
          }}
          loading={loading}
          error={error}
          submitLabel="Update"
        />
      </Card>
    );
  }

  // Action buttons for existing service
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setEditing(true)}
        className="text-txt-secondary hover:text-gold transition-colors p-1"
        aria-label="Edit service"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-txt-secondary hover:text-coral transition-colors p-1"
        aria-label="Delete service"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
