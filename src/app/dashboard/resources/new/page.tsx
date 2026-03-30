"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { ResourceCategory, ApplicationField } from "@/types/database";

const categoryOptions: { value: ResourceCategory; label: string }[] = [
  { value: "business", label: "Business" },
  { value: "housing", label: "Housing" },
  { value: "health", label: "Health" },
  { value: "youth", label: "Youth" },
  { value: "jobs", label: "Jobs" },
  { value: "food", label: "Food" },
  { value: "legal", label: "Legal" },
  { value: "senior", label: "Senior" },
  { value: "education", label: "Education" },
  { value: "veterans", label: "Veterans" },
  { value: "utilities", label: "Utilities" },
];

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "upcoming", label: "Upcoming" },
  { value: "limited", label: "Limited" },
];

const fieldTypeOptions: { value: ApplicationField["type"]; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown" },
];

const districtOptions = [
  { value: "", label: "All Districts" },
  { value: "1", label: "District 1" },
  { value: "2", label: "District 2" },
  { value: "3", label: "District 3" },
  { value: "4", label: "District 4" },
];

function inputClass(hasError?: boolean) {
  return `w-full bg-deep border ${
    hasError ? "border-coral/50" : "border-border-subtle"
  } rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-txt-secondary/50 focus:outline-none focus:border-gold/40 transition-colors`;
}

function labelClass() {
  return "block text-xs font-semibold text-txt-secondary mb-1.5";
}

export default function NewResourcePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [category, setCategory] = useState<ResourceCategory>("business");
  const [description, setDescription] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [status, setStatus] = useState("open");
  const [deadline, setDeadline] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [hours, setHours] = useState("");
  const [district, setDistrict] = useState("");
  const [acceptsApplications, setAcceptsApplications] = useState(false);
  const [applicationFields, setApplicationFields] = useState<ApplicationField[]>([]);

  function addField() {
    setApplicationFields((prev) => [
      ...prev,
      {
        name: `field_${prev.length + 1}`,
        label: "",
        type: "text",
        required: false,
        options: [],
        placeholder: "",
      },
    ]);
  }

  function updateField(index: number, updates: Partial<ApplicationField>) {
    setApplicationFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    );
  }

  function removeField(index: number) {
    setApplicationFields((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    // Validate application fields have labels
    if (acceptsApplications) {
      for (const field of applicationFields) {
        if (!field.label.trim()) {
          setError("All application fields must have a label");
          return;
        }
      }
    }

    setSaving(true);

    try {
      const body = {
        name: name.trim(),
        organization: organization.trim() || null,
        category,
        description: description.trim(),
        eligibility: eligibility.trim() || null,
        status,
        deadline: deadline || null,
        is_free: isFree,
        address: address.trim() || null,
        phone: phone.trim() || null,
        website: website.trim() || null,
        hours: hours.trim() || null,
        district: district ? parseInt(district) : null,
        accepts_applications: acceptsApplications,
        application_fields: acceptsApplications ? applicationFields : [],
        is_published: false,
      };

      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create resource");
      }

      router.push("/dashboard/resources");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 py-5">
      <h2 className="text-lg font-heading font-bold mb-4">New Resource</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Card className="bg-coral/10 border-coral/20">
            <p className="text-sm text-coral">{error}</p>
          </Card>
        )}

        {/* Basic Info */}
        <Card>
          <div className="space-y-3">
            <div>
              <label className={labelClass()}>Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Small Business Grant"
                className={inputClass()}
              />
            </div>
            <div>
              <label className={labelClass()}>Organization</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. City of Compton"
                className={inputClass()}
              />
            </div>
            <div>
              <label className={labelClass()}>Category</label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as ResourceCategory)
                }
                className={inputClass()}
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass()}>Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this resource..."
                className={inputClass()}
                rows={3}
              />
            </div>
            <div>
              <label className={labelClass()}>Eligibility</label>
              <textarea
                value={eligibility}
                onChange={(e) => setEligibility(e.target.value)}
                placeholder="Who is eligible?"
                className={inputClass()}
                rows={2}
              />
            </div>
          </div>
        </Card>

        {/* Status & Timing */}
        <Card>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass()}>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={inputClass()}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass()}>District</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className={inputClass()}
                >
                  {districtOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass()}>Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={inputClass()}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-txt-secondary">
                Free Resource
              </label>
              <button
                type="button"
                onClick={() => setIsFree(!isFree)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  isFree ? "bg-emerald/30" : "bg-card-hover"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${
                    isFree
                      ? "translate-x-5 bg-emerald"
                      : "translate-x-0 bg-txt-secondary"
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        {/* Contact Info */}
        <Card>
          <p className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
            Contact Info
          </p>
          <div className="space-y-3">
            <div>
              <label className={labelClass()}>Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, Compton, CA"
                className={inputClass()}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass()}>Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(310) 555-0100"
                  className={inputClass()}
                />
              </div>
              <div>
                <label className={labelClass()}>Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className={inputClass()}
                />
              </div>
            </div>
            <div>
              <label className={labelClass()}>Hours</label>
              <input
                type="text"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Mon-Fri 9am-5pm"
                className={inputClass()}
              />
            </div>
          </div>
        </Card>

        {/* Applications */}
        <Card>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Accept Applications</p>
                <p className="text-xs text-txt-secondary">
                  Allow people to apply through the app
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAcceptsApplications(!acceptsApplications)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  acceptsApplications ? "bg-gold/30" : "bg-card-hover"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${
                    acceptsApplications
                      ? "translate-x-5 bg-gold"
                      : "translate-x-0 bg-txt-secondary"
                  }`}
                />
              </button>
            </div>

            {acceptsApplications && (
              <div className="space-y-3 pt-2 border-t border-border-subtle">
                <p className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">
                  Application Fields
                </p>

                {applicationFields.map((field, idx) => (
                  <Card key={idx} className="bg-deep space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-txt-secondary">
                        Field {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeField(idx)}
                        className="text-xs text-coral hover:text-coral/80"
                      >
                        Remove
                      </button>
                    </div>
                    <div>
                      <label className={labelClass()}>Label *</label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) =>
                          updateField(idx, { label: e.target.value })
                        }
                        placeholder="e.g. Business Name"
                        className={inputClass()}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelClass()}>Type</label>
                        <select
                          value={field.type}
                          onChange={(e) =>
                            updateField(idx, {
                              type: e.target.value as ApplicationField["type"],
                            })
                          }
                          className={inputClass()}
                        >
                          {fieldTypeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass()}>Name (key)</label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) =>
                            updateField(idx, { name: e.target.value })
                          }
                          placeholder="field_name"
                          className={inputClass()}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass()}>Placeholder</label>
                      <input
                        type="text"
                        value={field.placeholder || ""}
                        onChange={(e) =>
                          updateField(idx, { placeholder: e.target.value })
                        }
                        placeholder="Placeholder text..."
                        className={inputClass()}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-txt-secondary">
                        Required
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          updateField(idx, { required: !field.required })
                        }
                        className={`relative w-8 h-4 rounded-full transition-colors ${
                          field.required ? "bg-gold/30" : "bg-card-hover"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full transition-transform ${
                            field.required
                              ? "translate-x-4 bg-gold"
                              : "translate-x-0 bg-txt-secondary"
                          }`}
                        />
                      </button>
                    </div>
                    {field.type === "select" && (
                      <div>
                        <label className={labelClass()}>
                          Options (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={(field.options || []).join(", ")}
                          onChange={(e) =>
                            updateField(idx, {
                              options: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="Option 1, Option 2, Option 3"
                          className={inputClass()}
                        />
                      </div>
                    )}
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={addField}
                >
                  + Add Field
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Submit */}
        <Button type="submit" fullWidth loading={saving}>
          Create Resource
        </Button>
      </form>
    </div>
  );
}
