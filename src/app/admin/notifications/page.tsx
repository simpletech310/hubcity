"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Chip from "@/components/ui/Chip";

interface BroadcastEntry {
  id: string;
  title: string;
  body: string;
  target_district: number | null;
  recipient_count: number;
  created_at: string;
}

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetDistrict, setTargetDistrict] = useState("all");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [broadcasts, setBroadcasts] = useState<BroadcastEntry[]>([]);

  useEffect(() => {
    async function loadBroadcasts() {
      const res = await fetch("/api/admin/notifications/broadcast");
      if (res.ok) {
        const data = await res.json();
        setBroadcasts(data.broadcasts);
      }
    }
    loadBroadcasts();
  }, []);

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      setError("Title and message are required");
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/admin/notifications/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        body: body.trim(),
        target_district: targetDistrict !== "all" ? targetDistrict : null,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setSuccess(
        `Notification sent to ${data.recipient_count.toLocaleString()} recipients!`
      );
      setTitle("");
      setBody("");
      setTargetDistrict("all");
      // Reload broadcasts
      const reloadRes = await fetch("/api/admin/notifications/broadcast");
      if (reloadRes.ok) {
        const reloadData = await reloadRes.json();
        setBroadcasts(reloadData.broadcasts);
      }
    } else {
      setError(data.error || "Failed to send notification");
    }

    setSending(false);
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1">
          Send Notification
        </h1>
        <p className="text-sm text-txt-secondary">
          Broadcast messages to Hub City users
        </p>
      </div>

      {success && (
        <div className="mb-4 p-3 rounded-xl bg-emerald/10 border border-emerald/20">
          <p className="text-emerald text-sm font-medium">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-coral/10 border border-coral/20">
          <p className="text-coral text-sm font-medium">{error}</p>
        </div>
      )}

      <Card className="mb-8">
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Notification title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-txt-secondary mb-1.5">
              Message
            </label>
            <textarea
              className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 min-h-[100px] resize-none"
              placeholder="Write your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-txt-secondary mb-2">
              Target Audience
            </label>
            <div className="flex gap-2 flex-wrap">
              {["all", "1", "2", "3", "4"].map((d) => (
                <Chip
                  key={d}
                  label={d === "all" ? "All Districts" : `District ${d}`}
                  active={targetDistrict === d}
                  onClick={() => setTargetDistrict(d)}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-txt-secondary">
              Target:{" "}
              <span className="text-gold font-medium">
                {targetDistrict === "all" ? "All Districts" : `District ${targetDistrict}`}
              </span>
            </p>
            <Button onClick={handleSend} loading={sending}>
              Send Notification
            </Button>
          </div>
        </div>
      </Card>

      <h2 className="font-heading font-semibold text-lg mb-3">
        Recent Broadcasts
      </h2>
      <div className="space-y-2">
        {broadcasts.length === 0 && (
          <Card>
            <p className="text-sm text-txt-secondary text-center py-4">
              No broadcasts sent yet.
            </p>
          </Card>
        )}
        {broadcasts.map((broadcast) => (
          <Card key={broadcast.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{broadcast.title}</p>
                <p className="text-xs text-txt-secondary mt-0.5 line-clamp-1">
                  {broadcast.body}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge
                    label={
                      broadcast.target_district
                        ? `District ${broadcast.target_district}`
                        : "All Districts"
                    }
                    variant="cyan"
                  />
                  <span className="text-xs text-txt-secondary">
                    {broadcast.recipient_count.toLocaleString()} recipients
                  </span>
                </div>
              </div>
              <span className="text-xs text-txt-secondary shrink-0 ml-3">
                {timeAgo(broadcast.created_at)}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
