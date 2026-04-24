"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

  const inputStyle: React.CSSProperties = {
    background: "var(--paper)",
    color: "var(--ink-strong)",
    border: "2px solid var(--rule-strong-c)",
    borderRadius: 0,
  };

  function inputErrStyle(hasErr: boolean): React.CSSProperties {
    return hasErr
      ? { ...inputStyle, border: "2px solid var(--red-c, #c0392b)" }
      : inputStyle;
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
                Your application for {job.title} has been submitted
                successfully.
              </p>
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => router.push("/profile/jobs")}
                className="c-btn c-btn-primary w-full"
              >
                View My Applications
              </button>
              <button
                type="button"
                onClick={() => router.push("/jobs")}
                className="c-btn c-btn-outline w-full"
              >
                Browse Jobs
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
          href={`/jobs/${job.slug || job.id}`}
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
          Apply: {job.title}
        </h1>
      </div>

      {/* Form */}
      <div className="px-5 space-y-4">
        {/* Full Name */}
        <div className="w-full">
          <label className="c-kicker block mb-2">
            Full Name <span style={{ color: "var(--red-c, #c0392b)" }}>*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) setErrors((p) => { const n = { ...p }; delete n.fullName; return n; });
            }}
            placeholder="Your full name"
            className="w-full px-4 py-3 text-sm focus:outline-none"
            style={inputErrStyle(!!errors.fullName)}
          />
          {errors.fullName && (
            <p className="c-meta mt-1" style={{ color: "var(--red-c, #c0392b)" }}>{errors.fullName}</p>
          )}
        </div>

        {/* Email */}
        <div className="w-full">
          <label className="c-kicker block mb-2">
            Email <span style={{ color: "var(--red-c, #c0392b)" }}>*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((p) => { const n = { ...p }; delete n.email; return n; });
            }}
            placeholder="your@email.com"
            className="w-full px-4 py-3 text-sm focus:outline-none"
            style={inputErrStyle(!!errors.email)}
          />
          {errors.email && (
            <p className="c-meta mt-1" style={{ color: "var(--red-c, #c0392b)" }}>{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div className="w-full">
          <label className="c-kicker block mb-2">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(310) 555-0100"
            className="w-full px-4 py-3 text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>

        {/* US Citizen toggle */}
        <div className="w-full">
          <label className="c-kicker block mb-2">
            Are you a US citizen? <span style={{ color: "var(--red-c, #c0392b)" }}>*</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsUsCitizen(true);
                if (errors.isUsCitizen) setErrors((p) => { const n = { ...p }; delete n.isUsCitizen; return n; });
              }}
              className="flex-1 py-3 c-card-t press transition-colors"
              style={{
                fontSize: "13px",
                background: isUsCitizen === true ? "var(--gold-c)" : "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
              }}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => {
                setIsUsCitizen(false);
                if (errors.isUsCitizen) setErrors((p) => { const n = { ...p }; delete n.isUsCitizen; return n; });
              }}
              className="flex-1 py-3 c-card-t press transition-colors"
              style={{
                fontSize: "13px",
                background: isUsCitizen === false ? "var(--gold-c)" : "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
              }}
            >
              No
            </button>
          </div>
          {errors.isUsCitizen && (
            <p className="c-meta mt-1" style={{ color: "var(--red-c, #c0392b)" }}>{errors.isUsCitizen}</p>
          )}
        </div>

        {/* Compton Resident toggle */}
        <div className="w-full">
          <label className="c-kicker block mb-2">
            Are you a Compton resident? <span style={{ color: "var(--red-c, #c0392b)" }}>*</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsComptonResident(true);
                if (errors.isComptonResident) setErrors((p) => { const n = { ...p }; delete n.isComptonResident; return n; });
              }}
              className="flex-1 py-3 c-card-t press transition-colors"
              style={{
                fontSize: "13px",
                background: isComptonResident === true ? "var(--gold-c)" : "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
              }}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => {
                setIsComptonResident(false);
                if (errors.isComptonResident) setErrors((p) => { const n = { ...p }; delete n.isComptonResident; return n; });
              }}
              className="flex-1 py-3 c-card-t press transition-colors"
              style={{
                fontSize: "13px",
                background: isComptonResident === false ? "var(--gold-c)" : "var(--paper)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
              }}
            >
              No
            </button>
          </div>
          {errors.isComptonResident && (
            <p className="c-meta mt-1" style={{ color: "var(--red-c, #c0392b)" }}>
              {errors.isComptonResident}
            </p>
          )}
        </div>

        {/* Resume upload */}
        <div className="w-full">
          <label className="c-kicker block mb-2">
            Resume (PDF, max 5MB)
          </label>
          <label
            className="flex items-center justify-center gap-2 w-full px-4 py-3 cursor-pointer press"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
            }}
          >
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M9 2v10M5 6l4-4 4 4" />
              <path d="M2 12v2a2 2 0 002 2h10a2 2 0 002-2v-2" />
            </svg>
            <span className="c-card-t" style={{ fontSize: "13px" }}>
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
            <p className="c-meta mt-1" style={{ color: "var(--red-c, #c0392b)" }}>{errors.resume}</p>
          )}
        </div>

        {/* References */}
        <div className="w-full">
          <label className="c-kicker block mb-2">
            References (optional)
          </label>
          <textarea
            value={referencesText}
            onChange={(e) => setReferencesText(e.target.value)}
            placeholder="Name, phone/email, relationship..."
            rows={3}
            className="w-full px-4 py-3 text-sm focus:outline-none resize-none"
            style={inputStyle}
          />
        </div>

        {/* Cover Note */}
        <div className="w-full">
          <label className="c-kicker block mb-2">
            Cover Note (optional)
          </label>
          <textarea
            value={coverNote}
            onChange={(e) => setCoverNote(e.target.value)}
            placeholder="Tell us why you're interested in this position..."
            rows={4}
            className="w-full px-4 py-3 text-sm focus:outline-none resize-none"
            style={inputStyle}
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="c-btn c-btn-primary w-full"
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </div>
  );
}
