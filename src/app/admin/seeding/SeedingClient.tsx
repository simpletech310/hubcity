"use client";

import { useState, useRef } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

// ─── types ────────────────────────────────────────────────────────────────────

interface City {
  id: string;
  name: string;
  slug: string;
}

type Tab = "businesses" | "events" | "creators";

interface ParsedRow {
  [key: string]: string;
}

interface ImportProgress {
  current: number;
  total: number;
}

interface ImportResult {
  imported: number;
  skipped: number;
}

interface PendingInvite {
  email: string;
  role: string;
  cityId: string;
  cityName: string;
  sentAt: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    // Simple split — handles basic CSVs without embedded commas
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: ParsedRow = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function buildCSVBlob(headers: string[], examples: string[][]): string {
  const rows = [headers.join(","), ...examples.map((r) => r.join(","))];
  return rows.join("\n");
}

// ─── business CSV template ────────────────────────────────────────────────────

const BUSINESS_HEADERS = [
  "name",
  "category",
  "description",
  "address",
  "city_slug",
  "website_url",
  "phone",
  "email",
];

const BUSINESS_EXAMPLES = [
  [
    "Compton Coffee Co.",
    "restaurant",
    "Local coffee shop and café",
    "100 N Central Ave, Compton CA 90220",
    "compton",
    "https://example.com",
    "310-555-0100",
    "hello@example.com",
  ],
  [
    "Star Barbershop",
    "beauty",
    "Full-service barbershop",
    "200 E Compton Blvd, Compton CA 90221",
    "compton",
    "",
    "310-555-0200",
    "",
  ],
];

// ─── events CSV template ──────────────────────────────────────────────────────

const EVENT_HEADERS = [
  "title",
  "description",
  "starts_at",
  "ends_at",
  "venue_name",
  "address",
  "city_slug",
  "category",
  "ticket_price",
];

const EVENT_EXAMPLES = [
  [
    "Community Block Party",
    "Annual neighborhood celebration",
    "2026-07-04T14:00:00",
    "2026-07-04T20:00:00",
    "Compton Park",
    "100 N Central Ave, Compton CA 90220",
    "compton",
    "community",
    "0",
  ],
  [
    "Farmers Market",
    "Weekly fresh produce market",
    "2026-05-10T08:00:00",
    "2026-05-10T13:00:00",
    "City Hall Plaza",
    "205 S Willowbrook Ave, Compton CA 90220",
    "compton",
    "market",
    "0",
  ],
];

// ─── PreviewTable ─────────────────────────────────────────────────────────────

function PreviewTable({ rows }: { rows: ParsedRow[] }) {
  if (rows.length === 0) return null;
  const headers = Object.keys(rows[0]);
  const preview = rows.slice(0, 5);
  return (
    <div className="overflow-x-auto mt-4 rounded-xl border border-border-subtle">
      <table className="w-full text-xs min-w-[600px]">
        <thead>
          <tr className="bg-white/5">
            {headers.map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-txt-secondary whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {preview.map((row, i) => (
            <tr key={i} className="border-t border-border-subtle hover:bg-white/3 transition-colors">
              {headers.map((h) => (
                <td key={h} className="px-3 py-2 text-txt-secondary max-w-[180px] truncate">
                  {row[h] || <span className="opacity-30">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── CSVImportTab ─────────────────────────────────────────────────────────────

function CSVImportTab({
  label,
  headers,
  examples,
  endpoint,
  cityId,
  disabled,
}: {
  label: string;
  headers: string[];
  examples: string[][];
  endpoint: string;
  cityId: string;
  disabled: boolean;
}) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    const csv = buildCSVBlob(headers, examples);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label.toLowerCase()}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(file: File) {
    setParseError(null);
    setResult(null);
    setProgress(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setParseError("No valid rows found. Ensure the file has a header row and at least one data row.");
        setRows([]);
      } else {
        setRows(parsed);
      }
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    if (rows.length === 0 || !cityId) return;
    setImporting(true);
    setResult(null);
    setProgress({ current: 0, total: rows.length });

    try {
      // Send in a single batch; update progress to show "in flight"
      setProgress({ current: rows.length, total: rows.length });
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, cityId }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ imported: data.imported ?? 0, skipped: data.skipped ?? 0 });
      } else {
        setParseError(data.error ?? "Import failed");
      }
    } catch {
      setParseError("Network error. Please try again.");
    }

    setImporting(false);
    setProgress(null);
  }

  return (
    <div className="space-y-4">
      {/* Template download */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-txt-secondary">
          Upload a CSV with the required columns to bulk-import {label.toLowerCase()}.
        </p>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          Download CSV Template
        </Button>
      </div>

      {/* Required columns reference */}
      <div className="flex gap-1.5 flex-wrap">
        {headers.map((h) => (
          <span
            key={h}
            className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-txt-secondary border border-border-subtle"
          >
            {h}
          </span>
        ))}
      </div>

      {/* Dropzone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
          fileName
            ? "border-gold/40 bg-gold/5"
            : "border-border-subtle hover:border-gold/30 hover:bg-white/3"
        }`}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {fileName ? (
          <div className="space-y-1">
            <p className="text-gold font-medium text-sm">{fileName}</p>
            <p className="text-txt-secondary text-xs">{rows.length} rows parsed — click to replace</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mx-auto">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-txt-secondary">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-sm text-txt-secondary">Drop CSV here or click to browse</p>
            <p className="text-[11px] text-txt-secondary/60">.csv files only</p>
          </div>
        )}
      </div>

      {/* Parse error */}
      {parseError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-red-400 text-sm">{parseError}</p>
        </div>
      )}

      {/* Preview */}
      {rows.length > 0 && (
        <div>
          <p className="text-sm text-txt-secondary mb-1">
            <span className="text-white font-semibold">{rows.length}</span> {label.toLowerCase()} ready to import
            {rows.length > 5 && (
              <span className="text-txt-secondary/60"> (showing first 5)</span>
            )}
          </p>
          <PreviewTable rows={rows} />
        </div>
      )}

      {/* Progress */}
      {progress && (
        <div className="p-3 rounded-xl bg-gold/10 border border-gold/20">
          <p className="text-gold text-sm font-medium">
            Importing... {progress.current}/{progress.total}
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-emerald-400 text-sm font-semibold mb-0.5">Import complete</p>
          <p className="text-sm text-txt-secondary">
            {result.imported > 0 && (
              <span className="text-emerald-400 font-medium">✓ {result.imported} imported</span>
            )}
            {result.imported > 0 && result.skipped > 0 && "  "}
            {result.skipped > 0 && (
              <span className="text-yellow-400 font-medium">⚠ {result.skipped} skipped (duplicates)</span>
            )}
          </p>
        </div>
      )}

      {/* Import button */}
      <Button
        onClick={handleImport}
        loading={importing}
        disabled={rows.length === 0 || !cityId || disabled}
      >
        {importing ? "Importing..." : `Import ${rows.length > 0 ? rows.length : ""} ${label}`}
      </Button>

      {!cityId && (
        <p className="text-xs text-yellow-400">Select a target city above before importing.</p>
      )}
    </div>
  );
}

// ─── CreatorsTab ──────────────────────────────────────────────────────────────

const CREATOR_ROLES = [
  { value: "content_creator", label: "Content Creator" },
  { value: "resource_provider", label: "Resource Provider" },
  { value: "chamber_admin", label: "Chamber Admin" },
];

function CreatorsTab({ cities }: { cities: City[] }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("content_creator");
  const [cityId, setCityId] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);

  async function handleSendInvite() {
    if (!email.trim() || !cityId) return;
    setError(null);
    setSending(true);

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role, cityId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const city = cities.find((c) => c.id === cityId);
        setPendingInvites((prev) => [
          {
            email: email.trim(),
            role,
            cityId,
            cityName: city?.name ?? cityId,
            sentAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setEmail("");
      } else {
        setError(data.error ?? "Failed to send invite");
      }
    } catch {
      setError("Network error. Please try again.");
    }

    setSending(false);
  }

  const selectedRole = CREATOR_ROLES.find((r) => r.value === role);

  return (
    <div className="space-y-6">
      <p className="text-sm text-txt-secondary">
        Since creators are users, they can&apos;t be bulk-imported via CSV. Use this form to invite them by email.
      </p>

      <Card>
        <h3 className="text-sm font-semibold mb-4">Send Creator Invite</h3>
        <div className="space-y-3">
          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-txt-secondary mb-1.5">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="creator@example.com"
              className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary/50 focus:outline-none focus:border-gold/40"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-txt-secondary mb-1.5">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/40 appearance-none"
            >
              {CREATOR_ROLES.map((r) => (
                <option key={r.value} value={r.value} className="bg-midnight">
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-medium text-txt-secondary mb-1.5">
              City
            </label>
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/40 appearance-none"
            >
              <option value="" className="bg-midnight">
                — Select a city —
              </option>
              {cities.map((c) => (
                <option key={c.id} value={c.id} className="bg-midnight">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <Button
            onClick={handleSendInvite}
            loading={sending}
            disabled={!email.trim() || !cityId}
          >
            Send Invite
          </Button>
        </div>
      </Card>

      {/* Pending invites list */}
      {pendingInvites.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-gold" />
            Pending Invites
            <span className="text-[11px] font-normal text-txt-secondary ml-0.5">(this session)</span>
          </h3>
          <div className="space-y-2">
            {pendingInvites.map((invite, i) => (
              <Card key={i}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{invite.email}</p>
                    <p className="text-xs text-txt-secondary mt-0.5">
                      {selectedRole?.label ?? invite.role} · {invite.cityName}
                    </p>
                  </div>
                  <span className="text-[10px] text-yellow-400 font-semibold px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 shrink-0">
                    Invited
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function SeedingClient({ cities }: { cities: City[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("businesses");
  const [selectedCityId, setSelectedCityId] = useState("");

  const selectedCity = cities.find((c) => c.id === selectedCityId);

  const tabs: { key: Tab; label: string }[] = [
    { key: "businesses", label: "Businesses" },
    { key: "events", label: "Events" },
    { key: "creators", label: "Creators" },
  ];

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1">City Seeding Tools</h1>
        <p className="text-sm text-txt-secondary">
          Import content for a new city launch
        </p>
      </div>

      {/* ── City selector ── */}
      <Card className="mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-txt-secondary mb-1.5">
              Target city
            </label>
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/40 appearance-none"
            >
              <option value="" className="bg-midnight">
                — Select a city —
              </option>
              {cities.map((c) => (
                <option key={c.id} value={c.id} className="bg-midnight">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {selectedCity && (
            <div className="flex items-center gap-2 mt-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gold/15 text-gold border border-gold/30">
                {selectedCity.name}
              </span>
              <span className="text-[11px] text-txt-secondary font-mono">
                /{selectedCity.slug}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-6 border-b border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? "text-gold"
                : "text-txt-secondary hover:text-white"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {activeTab === "businesses" && (
        <CSVImportTab
          key="businesses"
          label="Businesses"
          headers={BUSINESS_HEADERS}
          examples={BUSINESS_EXAMPLES}
          endpoint="/api/admin/seed/businesses"
          cityId={selectedCityId}
          disabled={!selectedCityId}
        />
      )}

      {activeTab === "events" && (
        <CSVImportTab
          key="events"
          label="Events"
          headers={EVENT_HEADERS}
          examples={EVENT_EXAMPLES}
          endpoint="/api/admin/seed/events"
          cityId={selectedCityId}
          disabled={!selectedCityId}
        />
      )}

      {activeTab === "creators" && (
        <CreatorsTab cities={cities} />
      )}
    </div>
  );
}
