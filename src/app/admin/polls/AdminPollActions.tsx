"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

interface Poll {
  id: string;
  status: string;
  is_published: boolean;
}

export default function AdminPollActions({ poll }: { poll: Poll }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updatePoll = async (updates: Record<string, unknown>) => {
    setLoading(true);
    try {
      await fetch(`/api/admin/polls/${poll.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const deletePoll = async () => {
    if (!confirm("Delete this poll and all its votes permanently?")) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/polls/${poll.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => updatePoll({ is_published: !poll.is_published })}
        loading={loading}
      >
        {poll.is_published ? "Hide" : "Show"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          updatePoll({ status: poll.status === "active" ? "closed" : "active" })
        }
        loading={loading}
      >
        {poll.status === "active" ? "Close" : "Reopen"}
      </Button>
      <Button variant="danger" size="sm" onClick={deletePoll} loading={loading}>
        Delete
      </Button>
    </div>
  );
}
