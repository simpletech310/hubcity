"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function ServiceActions({
  serviceId,
  businessId,
  isAddButton,
}: {
  serviceId?: string;
  businessId: string;
  isAddButton?: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleDelete() {
    if (!serviceId) return;
    setLoading(true);
    try {
      await fetch(`/api/services/${serviceId}`, { method: "DELETE" });
      router.refresh();
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const dollars = parseFloat(priceDisplay);
    if (!name.trim() || isNaN(dollars) || !duration) {
      setError("Name, price, and duration are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          name: name.trim(),
          description: description.trim() || null,
          price: Math.round(dollars * 100),
          duration: parseInt(duration),
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setName("");
        setDescription("");
        setPriceDisplay("");
        setDuration("");
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

  if (isAddButton) {
    return (
      <>
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} fullWidth variant="outline">
            + Add Service
          </Button>
        ) : (
          <Card>
            <form onSubmit={handleAdd} className="space-y-3">
              <h3 className="text-sm font-semibold">New Service</h3>
              <Input
                label="Name"
                placeholder="e.g. Haircut"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Description (optional)"
                placeholder="Describe the service..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Price ($)"
                  placeholder="25.00"
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceDisplay}
                  onChange={(e) => setPriceDisplay(e.target.value)}
                  required
                />
                <Input
                  label="Duration (min)"
                  placeholder="30"
                  type="number"
                  min="5"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-xs text-coral">{error}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" loading={loading} size="sm" className="flex-1">
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}
      </>
    );
  }

  // Delete button for existing service
  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-txt-secondary hover:text-coral transition-colors p-1"
    >
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}
