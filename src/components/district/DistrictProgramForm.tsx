"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";

// ─── Types ──────────────────────────────────────────

interface ProgramData {
  id?: string;
  title: string;
  description: string | null;
  category: string;
  location_name: string | null;
  schedule: string | null;
  start_date: string | null;
  end_date: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
}

interface DistrictProgramFormProps {
  district: number;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (program: ProgramData & { id: string }) => void;
  editProgram?: ProgramData | null;
}

const CATEGORIES = [
  { value: "community", label: "Community" },
  { value: "youth", label: "Youth" },
  { value: "sports", label: "Sports" },
  { value: "education", label: "Education" },
  { value: "health", label: "Health" },
  { value: "senior", label: "Senior" },
  { value: "arts", label: "Arts" },
];

const inputClass =
  "w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 transition-colors";

// ─── Component ──────────────────────────────────────

export default function DistrictProgramForm({
  district,
  isOpen,
  onClose,
  onCreated,
  editProgram,
}: DistrictProgramFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("community");
  const [locationName, setLocationName] = useState("");
  const [schedule, setSchedule] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!editProgram;

  // Populate fields when editing
  useEffect(() => {
    if (editProgram) {
      setTitle(editProgram.title || "");
      setDescription(editProgram.description || "");
      setCategory(editProgram.category || "community");
      setLocationName(editProgram.location_name || "");
      setSchedule(editProgram.schedule || "");
      setStartDate(editProgram.start_date || "");
      setEndDate(editProgram.end_date || "");
      setContactName(editProgram.contact_name || "");
      setContactPhone(editProgram.contact_phone || "");
      setContactEmail(editProgram.contact_email || "");
    } else {
      setTitle("");
      setDescription("");
      setCategory("community");
      setLocationName("");
      setSchedule("");
      setStartDate("");
      setEndDate("");
      setContactName("");
      setContactPhone("");
      setContactEmail("");
    }
    setError("");
  }, [editProgram, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    const payload: Record<string, string | null> = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      location_name: locationName.trim() || null,
      schedule: schedule.trim() || null,
      start_date: startDate || null,
      end_date: endDate || null,
      contact_name: contactName.trim() || null,
      contact_phone: contactPhone.trim() || null,
      contact_email: contactEmail.trim() || null,
    };

    try {
      const url = isEditing
        ? `/api/districts/${district}/programs?id=${editProgram!.id}`
        : `/api/districts/${district}/programs`;

      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save program");
      }

      const data = await res.json();
      onCreated(data.program);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Form panel */}
      <div className="relative w-full max-w-[430px] max-h-[85vh] overflow-y-auto rounded-t-3xl glass-card-elevated border-t border-white/[0.08] p-5 pb-safe animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold">
            {isEditing ? "Edit Program" : "New Program"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center press"
          >
            <Icon name="close" size={16} className="text-white/60" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral text-xs">
            {error}
          </div>
        )}

        {/* Fields */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
              Title <span className="text-coral">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Program title"
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the program..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`${inputClass} appearance-none`}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
              Location
            </label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Compton Community Center"
              className={inputClass}
            />
          </div>

          {/* Schedule */}
          <div>
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
              Schedule
            </label>
            <input
              type="text"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="e.g. Tuesdays & Thursdays, 4-6 PM"
              className={inputClass}
            />
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1.5 block">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Contact section */}
          <div className="pt-2 border-t border-white/[0.06]">
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-3">
              Contact Info
            </p>
            <div className="space-y-3">
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Contact name"
                className={inputClass}
              />
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Phone number"
                className={inputClass}
              />
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Email address"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/[0.06] text-sm font-semibold text-white/60 press hover:bg-white/[0.08] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-gold text-black text-sm font-bold press hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Program"}
          </button>
        </div>
      </div>
    </div>
  );
}
