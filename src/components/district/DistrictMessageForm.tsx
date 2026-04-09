"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface DistrictMessageFormProps {
  district: number;
  councilMemberName: string;
}

export default function DistrictMessageForm({ district, councilMemberName }: DistrictMessageFormProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;

    setSending(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/districts/${district}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          body: body.trim(),
        }),
      });

      if (res.status === 403) {
        setError("Only verified residents can message council members");
        setSending(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to send message");
        setSending(false);
        return;
      }

      setSuccess(true);
      setSubject("");
      setBody("");
      setTimeout(() => setSuccess(false), 4000);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSending(false);
  };

  return (
    <Card variant="glass-elevated">
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="text-sm font-semibold text-white">
          Message {councilMemberName}
        </h3>

        {success && (
          <div className="bg-emerald/10 border border-emerald/30 rounded-xl px-4 py-2.5 text-sm text-emerald font-medium">
            Message sent!
          </div>
        )}

        {error && (
          <div className="bg-coral/10 border border-coral/30 rounded-xl px-4 py-2.5 text-sm text-coral font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="text-[10px] text-txt-secondary uppercase tracking-wider font-semibold">
            Subject
          </label>
          <input
            type="text"
            placeholder="What is this about?"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full mt-1 bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40"
          />
        </div>

        <div>
          <label className="text-[10px] text-txt-secondary uppercase tracking-wider font-semibold">
            Message
          </label>
          <textarea
            placeholder="Write your message..."
            value={body}
            onChange={(e) => {
              if (e.target.value.length <= 1000) setBody(e.target.value);
            }}
            required
            rows={5}
            className="w-full mt-1 bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 resize-none"
          />
          <p className="text-[10px] text-txt-secondary text-right mt-1">
            {body.length}/1000
          </p>
        </div>

        <Button type="submit" loading={sending} disabled={!subject.trim() || !body.trim()}>
          Send Message
        </Button>
      </form>
    </Card>
  );
}
