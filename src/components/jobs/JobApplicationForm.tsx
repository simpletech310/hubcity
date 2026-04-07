"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import type { JobListing } from "@/types/database";

interface JobApplicationFormProps {
  job: JobListing;
}

export default function JobApplicationForm({ job }: JobApplicationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isUsCitizen, setIsUsCitizen] = useState<boolean | null>(null);
  const [isComptonResident, setIsComptonResident] = useState<boolean | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [referencesText, setReferencesText] = useState("");
  const [coverNote, setCoverNote] = useState("");

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = "Full name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Please enter a valid email";
    if (isUsCitizen === null) newErrors.isUsCitizen = "This field is required";
    if (isComptonResident === null)
      newErrors.isComptonResident = "This field is required";
    if (resumeFile && resumeFile.size > 5 * 1024 * 1024)
      newErrors.resume = "Resume must be under 5MB";
    if (resumeFile && !resumeFile.name.toLowerCase().endsWith(".pdf"))
      newErrors.resume = "Only PDF files are accepted";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setLoading(true);
    try {
      let resume_url: string | null = null;

      // Upload resume if provided
      if (resumeFile) {
        const supabase = createClient();
        const ext = "pdf";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(path, resumeFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("resumes")
          .getPublicUrl(path);
        resume_url = urlData.publicUrl;
      }

      const res = await fetch(`/api/jobs/${job.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone: phone || "",
          is_us_citizen: isUsCitizen,
          is_compton_resident: isComptonResident,
          resume_url,
          references_text: referencesText || null,
          cover_note: coverNote || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 409) {
          alert("You have already applied for this job.");
          return;
        }
        throw new Error(data.error || "Failed to submit application");
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
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
                Your application for {job.title} has been submitted
                successfully.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                fullWidth
                onClick={() => router.push("/profile/jobs")}
              >
                View My Applications
              </Button>
              <Button
                fullWidth
                variant="secondary"
                onClick={() => router.push("/jobs")}
              >
                Browse Jobs
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
          href={`/jobs/${job.slug || job.id}`}
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
          Apply: {job.title}
        </h1>
      </div>

      {/* Form */}
      <div className="px-5 space-y-4">
        <Input
          label="Full Name *"
          type="text"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (errors.fullName) setErrors((p) => { const n = { ...p }; delete n.fullName; return n; });
          }}
          placeholder="Your full name"
          error={errors.fullName}
        />

        <Input
          label="Email *"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((p) => { const n = { ...p }; delete n.email; return n; });
          }}
          placeholder="your@email.com"
          error={errors.email}
        />

        <Input
          label="Phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(310) 555-0100"
        />

        {/* US Citizen toggle */}
        <div className="w-full">
          <label className="block text-sm font-medium text-txt-secondary mb-1.5">
            Are you a US citizen? *
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsUsCitizen(true);
                if (errors.isUsCitizen) setErrors((p) => { const n = { ...p }; delete n.isUsCitizen; return n; });
              }}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all press ${
                isUsCitizen === true
                  ? "bg-emerald/20 text-emerald border border-emerald/30"
                  : "bg-white/5 text-txt-secondary border border-border-subtle hover:border-white/20"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => {
                setIsUsCitizen(false);
                if (errors.isUsCitizen) setErrors((p) => { const n = { ...p }; delete n.isUsCitizen; return n; });
              }}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all press ${
                isUsCitizen === false
                  ? "bg-coral/20 text-coral border border-coral/30"
                  : "bg-white/5 text-txt-secondary border border-border-subtle hover:border-white/20"
              }`}
            >
              No
            </button>
          </div>
          {errors.isUsCitizen && (
            <p className="mt-1 text-xs text-coral">{errors.isUsCitizen}</p>
          )}
        </div>

        {/* Compton Resident toggle */}
        <div className="w-full">
          <label className="block text-sm font-medium text-txt-secondary mb-1.5">
            Are you a Compton resident? *
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsComptonResident(true);
                if (errors.isComptonResident) setErrors((p) => { const n = { ...p }; delete n.isComptonResident; return n; });
              }}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all press ${
                isComptonResident === true
                  ? "bg-emerald/20 text-emerald border border-emerald/30"
                  : "bg-white/5 text-txt-secondary border border-border-subtle hover:border-white/20"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => {
                setIsComptonResident(false);
                if (errors.isComptonResident) setErrors((p) => { const n = { ...p }; delete n.isComptonResident; return n; });
              }}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all press ${
                isComptonResident === false
                  ? "bg-coral/20 text-coral border border-coral/30"
                  : "bg-white/5 text-txt-secondary border border-border-subtle hover:border-white/20"
              }`}
            >
              No
            </button>
          </div>
          {errors.isComptonResident && (
            <p className="mt-1 text-xs text-coral">
              {errors.isComptonResident}
            </p>
          )}
        </div>

        {/* Resume upload */}
        <div className="w-full">
          <label className="block text-sm font-medium text-txt-secondary mb-1.5">
            Resume (PDF, max 5MB)
          </label>
          <label className="flex items-center justify-center gap-2 w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm cursor-pointer hover:border-gold/30 transition-colors press">
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-txt-secondary"
            >
              <path d="M9 2v10M5 6l4-4 4 4" />
              <path d="M2 12v2a2 2 0 002 2h10a2 2 0 002-2v-2" />
            </svg>
            <span className={resumeFile ? "text-white" : "text-txt-secondary"}>
              {resumeFile ? resumeFile.name : "Upload Resume"}
            </span>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setResumeFile(file);
                if (errors.resume)
                  setErrors((p) => {
                    const n = { ...p };
                    delete n.resume;
                    return n;
                  });
              }}
            />
          </label>
          {errors.resume && (
            <p className="mt-1 text-xs text-coral">{errors.resume}</p>
          )}
        </div>

        {/* References */}
        <div className="w-full">
          <label className="block text-sm font-medium text-txt-secondary mb-1.5">
            References (optional)
          </label>
          <textarea
            value={referencesText}
            onChange={(e) => setReferencesText(e.target.value)}
            placeholder="Name, phone/email, relationship..."
            rows={3}
            className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-colors resize-none"
          />
        </div>

        {/* Cover Note */}
        <div className="w-full">
          <label className="block text-sm font-medium text-txt-secondary mb-1.5">
            Cover Note (optional)
          </label>
          <textarea
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
            placeholder="Tell us why you're interested in this position..."
            rows={4}
            className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-colors resize-none"
          />
        </div>

        <Button fullWidth size="lg" onClick={handleSubmit} loading={loading}>
          Submit Application
        </Button>
      </div>
    </div>
  );
}
