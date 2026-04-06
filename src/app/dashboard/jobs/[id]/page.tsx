"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import type { JobType, SalaryType, JobListing } from "@/types/database";

const jobTypeOptions: { value: JobType; label: string }[] = [
  { value: "full_time", label: "Full-Time" },
  { value: "part_time", label: "Part-Time" },
  { value: "contract", label: "Contract" },
  { value: "seasonal", label: "Seasonal" },
  { value: "internship", label: "Internship" },
  { value: "volunteer", label: "Volunteer" },
];

const salaryTypeOptions: { value: SalaryType; label: string }[] = [
  { value: "hourly", label: "Hourly" },
  { value: "salary", label: "Salary (Annual)" },
  { value: "commission", label: "Commission" },
  { value: "tips", label: "Tips" },
];

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [jobType, setJobType] = useState<JobType>("full_time");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryType, setSalaryType] = useState<SalaryType | "">("");
  const [location, setLocation] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [organizationName, setOrganizationName] = useState("");

  useEffect(() => {
    async function loadJob() {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) {
        setError("Job not found");
        setLoading(false);
        return;
      }
      const data = await res.json();
      const job = data.job as JobListing;

      setTitle(job.title);
      setDescription(job.description);
      setRequirements(job.requirements ?? "");
      setJobType(job.job_type);
      setSalaryMin(job.salary_min?.toString() ?? "");
      setSalaryMax(job.salary_max?.toString() ?? "");
      setSalaryType(job.salary_type ?? "");
      setLocation(job.location ?? "");
      setIsRemote(job.is_remote);
      setDeadline(job.application_deadline ?? "");
      setContactEmail(job.contact_email ?? "");
      setContactPhone(job.contact_phone ?? "");
      setOrganizationName(job.organization_name ?? "");
      setLoading(false);
    }
    loadJob();
  }, [jobId]);

  const isVolunteer = jobType === "volunteer";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const body: Record<string, unknown> = {
        title,
        description,
        requirements: requirements || null,
        job_type: jobType,
        location: location || null,
        is_remote: isRemote,
        application_deadline: deadline || null,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        organization_name: organizationName || null,
      };

      if (!isVolunteer) {
        body.salary_min = salaryMin ? parseFloat(salaryMin) : null;
        body.salary_max = salaryMax ? parseFloat(salaryMax) : null;
        body.salary_type = salaryType || null;
      } else {
        body.salary_min = null;
        body.salary_max = null;
        body.salary_type = null;
      }

      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update listing");
      }

      router.push("/dashboard/jobs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-5">
        <div className="skeleton h-8 w-48 rounded-xl mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/dashboard/jobs"
          className="text-gold text-sm font-semibold press"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="inline mr-1"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
          Back
        </Link>
      </div>

      <h1 className="font-heading text-lg font-bold mb-1">Edit Listing</h1>
      <p className="text-xs text-txt-secondary mb-5">
        Update your job or volunteer listing
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-coral/10 border border-coral/20 text-coral text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Organization Name */}
        <div>
          <label className="block text-xs font-semibold text-txt-secondary mb-1.5">
            Organization Name
          </label>
          <input
            type="text"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-border-subtle text-sm text-white placeholder:text-txt-secondary/50 outline-none focus:border-gold/30 transition-colors"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-txt-secondary mb-1.5">
            Job Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-border-subtle text-sm text-white outline-none focus:border-gold/30 transition-colors"
          />
        </div>

        {/* Job Type */}
        <div>
          <label className="block text-xs font-semibold text-txt-secondary mb-1.5">
            Type *
          </label>
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value as JobType)}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-border-subtle text-sm text-white outline-none focus:border-gold/30 transition-colors"
          >
            {jobTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-deep">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-txt-secondary mb-1.5">
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-border-subtle text-sm text-white outline-none focus:border-gold/30 transition-colors resize-none"
          />
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-xs font-semibold text-txt-secondary mb-1.5">
            Requirements
          </label>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-border-subtle text-sm text-white outline-none focus:border-gold/30 transition-colors resize-none"
          />
        </div>

        {/* Salary */}
        {!isVolunteer && (
          <div>
            <label className="block text-xs font-semibold text-txt-secondary mb-1.5">
              Compensation
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="Min"
                className="px-3 py-3 rounded-xl bg-white/[0.04] border border-border-subtle text-sm text-white placeholder:text-txt-secondary/50 outline-none focus:border-gold/30 transition-colors"
              />
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="Max"
                className="px-3 py-3 rounded-xl bg-white/[0.04] border border-border-subtle text-sm text-white placeholder:text-txt-secondary/50 outline-none focus:border-gold/30 transition-colors"
              />
              <select
                value={salaryType}
                onChange={(e) => setSalaryType(e.target.value as SalaryType)}
                className="px-3 py-3 rounded-xl bg-white/[0.04] border border-border-subtle text-sm text-white outline-none focus:border-gold/30 transition-colors"
              >
                <option value="" className="bg-deep">Rate</option>
                {salaryTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-deep">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Location */}
        <div>
          <label className="block text-xs font-semibold text-txt-secondary mb-1.5">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-border-subtle text-sm text-white outline-none focus:border-gold/30 transition-colors"
          />
          <label className="flex items-center gap-2 mt-2 text-xs text-txt-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={isRemote}
              onChange={(e) => setIsRemote(e.target.checked)}
              className="accent-gold"
            />
            This is a remote position
          </label>
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-xs font-semibold text-txt-secondary mb-1.5">
            Application Deadline
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-border-subtle text-sm text-white outline-none focus:border-gold/30 transition-colors"
          />
        </div>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-txt-secondary mb-1.5">
              Contact Email
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-3 py-3 rounded-xl bg-white/[0.04] border border-border-subtle text-sm text-white outline-none focus:border-gold/30 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-txt-secondary mb-1.5">
              Contact Phone
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-3 py-3 rounded-xl bg-white/[0.04] border border-border-subtle text-sm text-white outline-none focus:border-gold/30 transition-colors"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !title || !description}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold to-gold-light text-midnight font-bold text-sm press hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
