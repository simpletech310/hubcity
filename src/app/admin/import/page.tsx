"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";

const DATA_TYPES = [
  { value: "businesses", label: "Businesses", icon: "store", fields: ["name*", "slug", "category", "description", "address", "phone", "email", "website", "hours", "district", "is_featured"] },
  { value: "events", label: "Events", icon: "calendar", fields: ["title*", "start_date*", "start_time", "end_date", "end_time", "description", "category", "location_name", "address", "is_featured"] },
  { value: "resources", label: "Resources", icon: "lightbulb", fields: ["title*", "description", "category", "eligibility", "how_to_apply", "deadline", "contact_phone", "contact_email", "website_url"] },
  { value: "schools", label: "Schools", icon: "graduation", fields: ["name*", "school_type", "address", "phone", "website", "principal", "district", "enrollment", "grades", "rating"] },
  { value: "jobs", label: "Jobs", icon: "briefcase", fields: ["title*", "description", "company_name", "category", "employment_type", "salary_min", "salary_max", "location", "is_remote"] },
];

interface ImportResult {
  success: boolean;
  inserted: number;
  errors: string[];
  total: number;
}

export default function AdminImportPage() {
  const [dataType, setDataType] = useState("businesses");
  const [jsonInput, setJsonInput] = useState("");
  const [csvInput, setCsvInput] = useState("");
  const [inputMode, setInputMode] = useState<"json" | "csv">("json");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedType = DATA_TYPES.find((t) => t.value === dataType)!;

  function parseCSV(csv: string): Record<string, unknown>[] {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const records: Record<string, unknown>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const record: Record<string, unknown> = {};
      headers.forEach((h, idx) => {
        const val = values[idx] || "";
        // Parse booleans and numbers
        if (val === "true") record[h] = true;
        else if (val === "false") record[h] = false;
        else if (val && !isNaN(Number(val)) && h.includes("salary") || h === "enrollment" || h === "rating" || h === "district") {
          record[h] = Number(val);
        } else {
          record[h] = val || null;
        }
      });
      records.push(record);
    }
    return records;
  }

  async function handleImport() {
    setError(null);
    setResult(null);

    let records: Record<string, unknown>[];
    try {
      if (inputMode === "json") {
        records = JSON.parse(jsonInput);
        if (!Array.isArray(records)) {
          setError("JSON must be an array of objects");
          return;
        }
      } else {
        records = parseCSV(csvInput);
        if (records.length === 0) {
          setError("CSV must have a header row and at least one data row");
          return;
        }
      }
    } catch {
      setError("Invalid format. Please check your input.");
      return;
    }

    if (records.length === 0) {
      setError("No records to import");
      return;
    }

    if (records.length > 500) {
      setError("Maximum 500 records per import");
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: dataType, records }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Import failed");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setImporting(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1">Data Import</h1>
        <p className="text-sm text-txt-secondary">
          Bulk import data via JSON or CSV
        </p>
      </div>

      {/* Data Type Selection */}
      <div className="flex gap-2 flex-wrap mb-6">
        {DATA_TYPES.map((t) => (
          <Chip
            key={t.value}
            label={`${t.icon} ${t.label}`}
            active={dataType === t.value}
            onClick={() => setDataType(t.value)}
          />
        ))}
      </div>

      {/* Field Reference */}
      <Card className="mb-6">
        <h3 className="text-sm font-bold mb-2">
          {selectedType.icon} {selectedType.label} Fields
        </h3>
        <div className="flex gap-2 flex-wrap">
          {selectedType.fields.map((f) => (
            <span
              key={f}
              className={`px-2 py-1 rounded text-[10px] font-mono ${
                f.endsWith("*")
                  ? "bg-gold/10 text-gold border border-gold/20"
                  : "bg-white/5 text-txt-secondary"
              }`}
            >
              {f}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-txt-secondary mt-2">* = required field</p>
      </Card>

      {/* Input Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <Chip label="JSON" active={inputMode === "json"} onClick={() => setInputMode("json")} />
        <Chip label="CSV" active={inputMode === "csv"} onClick={() => setInputMode("csv")} />
      </div>

      {/* Input Area */}
      <Card className="mb-6">
        {inputMode === "json" ? (
          <div>
            <label className="block text-sm font-medium text-txt-secondary mb-1.5">
              JSON Array
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`[\n  { "name": "Example Business", "category": "restaurant", "address": "123 Main St" },\n  { "name": "Another Business", "category": "retail" }\n]`}
              className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-txt-secondary/50 focus:outline-none focus:border-gold/40 min-h-[200px] resize-y"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-txt-secondary mb-1.5">
              CSV Data (comma separated, first row = headers)
            </label>
            <textarea
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              placeholder={`name,category,address,phone\nExample Business,restaurant,123 Main St,310-555-0100\nAnother Business,retail,456 Oak Ave,310-555-0200`}
              className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-txt-secondary/50 focus:outline-none focus:border-gold/40 min-h-[200px] resize-y"
            />
          </div>
        )}
      </Card>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-coral/10 border border-coral/20">
          <p className="text-coral text-sm font-medium">{error}</p>
        </div>
      )}

      {result && (
        <div className="mb-4 p-4 rounded-xl bg-emerald/10 border border-emerald/20">
          <p className="text-emerald text-sm font-bold mb-1">
            Import Complete
          </p>
          <p className="text-sm text-txt-secondary">
            {result.inserted} of {result.total} records imported successfully.
          </p>
          {result.errors.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-coral font-semibold">Errors:</p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-coral/80">{e}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Import Button */}
      <Button onClick={handleImport} loading={importing}>
        Import {selectedType.label}
      </Button>
    </div>
  );
}
