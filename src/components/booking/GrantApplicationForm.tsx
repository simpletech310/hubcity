"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Resource, ApplicationField } from "@/types/database";

interface GrantApplicationFormProps {
  resource: Resource;
}

export default function GrantApplicationForm({
  resource,
}: GrantApplicationFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fields = resource.application_fields ?? [];

  function updateField(name: string, value: string) {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  async function handleFileUpload(fieldName: string, file: File | undefined) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [fieldName]: "File must be under 10 MB" }));
      return;
    }

    setUploading((prev) => ({ ...prev, [fieldName]: true }));
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setErrors((prev) => ({ ...prev, [fieldName]: "You must be signed in to upload" }));
        return;
      }

      const ext = file.name.split(".").pop() || "bin";
      const path = `${userId}/applications/${resource.id}/${fieldName}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("media")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (upErr) {
        setErrors((prev) => ({ ...prev, [fieldName]: upErr.message }));
        return;
      }

      const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
      updateField(fieldName, pub.publicUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setErrors((prev) => ({ ...prev, [fieldName]: msg }));
    } finally {
      setUploading((prev) => ({ ...prev, [fieldName]: false }));
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    for (const field of fields) {
      if (field.required && !formData[field.name]?.trim()) {
        newErrors[field.name] = `${field.label} is required`;
      }
      if (
        field.type === "email" &&
        formData[field.name] &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[field.name])
      ) {
        newErrors[field.name] = "Please enter a valid email";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource_id: resource.id,
          form_data: formData,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit application");

      setSuccess(true);
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputBaseStyle: React.CSSProperties = {
    background: "var(--paper)",
    color: "var(--ink-strong)",
    border: "2px solid var(--rule-strong-c)",
    borderRadius: 0,
  };

  function renderField(field: ApplicationField) {
    const value = formData[field.name] ?? "";
    const error = errors[field.name];
    const errBorder = error
      ? { border: "2px solid var(--red-c, #c0392b)" }
      : null;

    switch (field.type) {
      case "textarea":
        return (
          <div key={field.name} className="w-full">
            <label className="c-kicker block mb-2">
              {field.label}
              {field.required && <span className="ml-1" style={{ color: "var(--red-c, #c0392b)" }}>*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => updateField(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className="w-full px-4 py-3 text-sm focus:outline-none resize-none"
              style={{ ...inputBaseStyle, ...(errBorder || {}) }}
            />
            {error && (
              <p className="c-meta mt-1" style={{ color: "var(--red-c, #c0392b)" }}>{error}</p>
            )}
          </div>
        );

      case "select":
        return (
          <div key={field.name} className="w-full">
            <label className="c-kicker block mb-2">
              {field.label}
              {field.required && <span className="ml-1" style={{ color: "var(--red-c, #c0392b)" }}>*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => updateField(field.name, e.target.value)}
              className="w-full px-4 py-3 text-sm focus:outline-none appearance-none"
              style={{ ...inputBaseStyle, ...(errBorder || {}) }}
            >
              <option value="">
                {field.placeholder ?? "Select..."}
              </option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {error && (
              <p className="c-meta mt-1" style={{ color: "var(--red-c, #c0392b)" }}>{error}</p>
            )}
          </div>
        );

      case "file":
        return (
          <div key={field.name} className="w-full">
            <label className="c-kicker block mb-2">
              {field.label}
              {field.required && <span className="ml-1" style={{ color: "var(--red-c, #c0392b)" }}>*</span>}
            </label>
            {value ? (
              <div
                className="flex items-center justify-between gap-3 px-4 py-3"
                style={inputBaseStyle}
              >
                <a
                  href={value}
                  target="_blank"
                  rel="noopener"
                  className="c-meta truncate underline"
                  style={{ flex: 1 }}
                >
                  Uploaded — view
                </a>
                <button
                  type="button"
                  onClick={() => updateField(field.name, "")}
                  className="c-meta"
                  style={{ color: "var(--red-c, #c0392b)" }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <label
                className="block w-full px-4 py-3 text-sm cursor-pointer text-center"
                style={{ ...inputBaseStyle, ...(errBorder || {}) }}
              >
                {uploading[field.name] ? "Uploading…" : (field.placeholder || "Upload a photo or document")}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(field.name, e.target.files?.[0])}
                  disabled={uploading[field.name]}
                />
              </label>
            )}
            {error && (
              <p className="c-meta mt-1" style={{ color: "var(--red-c, #c0392b)" }}>{error}</p>
            )}
          </div>
        );

      default:
        return (
          <div key={field.name} className="w-full">
            <label className="c-kicker block mb-2">
              {field.label}
              {field.required && <span className="ml-1" style={{ color: "var(--red-c, #c0392b)" }}>*</span>}
            </label>
            <input
              type={field.type}
              value={value}
              onChange={(e) => updateField(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-4 py-3 text-sm focus:outline-none"
              style={{ ...inputBaseStyle, ...(errBorder || {}) }}
            />
            {error && (
              <p className="c-meta mt-1" style={{ color: "var(--red-c, #c0392b)" }}>{error}</p>
            )}
          </div>
        );
    }
  }

  if (success) {
    return (
      <div
        className="animate-fade-in pb-24 min-h-screen"
        style={{ background: "var(--paper)", color: "var(--ink-strong)" }}
      >
        <div className="px-5 pt-4">
          <div className="text-center py-12 space-y-5">
            <div
              className="w-16 h-16 flex items-center justify-center mx-auto"
              style={{
                background: "var(--gold-c)",
                border: "3px solid var(--rule-strong-c)",
              }}
            >
              <svg
                width="32"
                height="32"
                fill="none"
                stroke="var(--ink-strong)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h2 className="c-hero" style={{ fontSize: "28px" }}>
                Application Submitted
              </h2>
              <p className="c-meta mt-2">
                Your application for {resource.name} has been submitted successfully.
              </p>
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => router.push("/profile/applications")}
                className="c-btn c-btn-primary w-full"
              >
                View My Applications
              </button>
              <button
                type="button"
                onClick={() => router.push("/resources")}
                className="c-btn c-btn-outline w-full"
              >
                Browse Resources
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="animate-fade-in pb-24 min-h-screen"
      style={{ background: "var(--paper)", color: "var(--ink-strong)" }}
    >
      {/* Header */}
      <div
        className="px-5 pt-4 pb-4 mb-5"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <Link
          href={`/resources/${resource.slug || resource.id}`}
          className="c-kicker inline-flex items-center gap-1.5"
          style={{ color: "var(--ink-strong)" }}
        >
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
          Back
        </Link>
        <h1 className="c-hero mt-3" style={{ fontSize: "28px" }}>
          Apply: {resource.name}
        </h1>
        {resource.organization && (
          <p className="c-kicker mt-1" style={{ opacity: 0.7 }}>
            {resource.organization}
          </p>
        )}
      </div>

      {/* Deadline banner */}
      {resource.deadline && (
        <div
          className="mx-5 mb-4 px-4 py-3"
          style={{
            background: "var(--paper)",
            border: "2px solid var(--red-c, #c0392b)",
            color: "var(--red-c, #c0392b)",
          }}
        >
          <p className="c-kicker" style={{ color: "inherit" }}>
            Deadline:{" "}
            {new Date(resource.deadline).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      )}

      {/* Form */}
      <div className="px-5 space-y-4">
        {fields.length === 0 ? (
          <div
            className="text-center py-12"
            style={{
              background: "var(--paper-soft)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <p className="c-meta">
              This resource does not have an application form configured.
            </p>
          </div>
        ) : (
          <>
            {fields.map(renderField)}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="c-btn c-btn-primary w-full"
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
