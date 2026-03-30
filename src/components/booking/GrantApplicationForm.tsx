"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { Resource, ApplicationField } from "@/types/database";

interface GrantApplicationFormProps {
  resource: Resource;
}

export default function GrantApplicationForm({
  resource,
}: GrantApplicationFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
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

  function renderField(field: ApplicationField) {
    const value = formData[field.name] ?? "";
    const error = errors[field.name];

    switch (field.type) {
      case "textarea":
        return (
          <div key={field.name} className="w-full">
            <label className="block text-sm font-medium text-txt-secondary mb-1.5">
              {field.label}
              {field.required && <span className="text-coral ml-0.5">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => updateField(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-colors resize-none ${
                error ? "border-coral/50" : "border-border-subtle"
              }`}
            />
            {error && <p className="mt-1 text-xs text-coral">{error}</p>}
          </div>
        );

      case "select":
        return (
          <div key={field.name} className="w-full">
            <label className="block text-sm font-medium text-txt-secondary mb-1.5">
              {field.label}
              {field.required && <span className="text-coral ml-0.5">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => updateField(field.name, e.target.value)}
              className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-colors appearance-none ${
                error ? "border-coral/50" : "border-border-subtle"
              } ${!value ? "text-txt-secondary" : ""}`}
            >
              <option value="" className="bg-deep">
                {field.placeholder ?? "Select..."}
              </option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt} className="bg-deep">
                  {opt}
                </option>
              ))}
            </select>
            {error && <p className="mt-1 text-xs text-coral">{error}</p>}
          </div>
        );

      default:
        return (
          <Input
            key={field.name}
            label={
              field.label +
              (field.required ? " *" : "")
            }
            type={field.type}
            value={value}
            onChange={(e) => updateField(field.name, e.target.value)}
            placeholder={field.placeholder}
            error={error}
          />
        );
    }
  }

  if (success) {
    return (
      <div className="animate-fade-in pb-24">
        <div className="px-5 pt-4">
          <div className="text-center py-12 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald/20 flex items-center justify-center mx-auto">
              <svg
                width="32"
                height="32"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold">
                Application Submitted!
              </h2>
              <p className="text-sm text-txt-secondary mt-1">
                Your application for {resource.name} has been submitted successfully.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                fullWidth
                onClick={() => router.push("/profile/applications")}
              >
                View My Applications
              </Button>
              <Button
                fullWidth
                variant="secondary"
                onClick={() => router.push("/resources")}
              >
                Browse Resources
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="px-5 pt-4 mb-4">
        <Link
          href={`/resources/${resource.slug || resource.id}`}
          className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
          Back
        </Link>
        <h1 className="font-heading text-xl font-bold mt-3">
          Apply: {resource.name}
        </h1>
        {resource.organization && (
          <p className="text-sm text-txt-secondary mt-0.5">
            {resource.organization}
          </p>
        )}
      </div>

      {/* Deadline banner */}
      {resource.deadline && (
        <div className="mx-5 mb-4 bg-coral/10 border border-coral/20 rounded-xl px-4 py-2.5">
          <p className="text-xs text-coral font-semibold">
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
          <div className="text-center py-12">
            <p className="text-txt-secondary text-sm">
              This resource does not have an application form configured.
            </p>
          </div>
        ) : (
          <>
            {fields.map(renderField)}
            <Button
              fullWidth
              size="lg"
              onClick={handleSubmit}
              loading={loading}
            >
              Submit Application
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
