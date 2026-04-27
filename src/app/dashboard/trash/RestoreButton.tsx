"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SoftDeletableTable } from "@/lib/soft-delete";

export default function RestoreButton({
  table,
  id,
}: {
  table: SoftDeletableTable;
  id: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function restore() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/trash/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Restore failed");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Restore failed");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={restore}
        disabled={busy}
        className="press px-3 py-1.5"
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          background: "var(--ink-strong)",
          color: "var(--gold-c)",
          border: "2px solid var(--rule-strong-c)",
        }}
      >
        {busy ? "RESTORING…" : "RESTORE"}
      </button>
      {error && (
        <span
          className="text-xs"
          style={{ color: "var(--red-c, #E84855)" }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
