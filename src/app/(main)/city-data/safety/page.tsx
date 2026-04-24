import { createClient } from "@/lib/supabase/server";
import SectionHeader from "@/components/layout/SectionHeader";

export const metadata = {
  title: "Community Safety - Culture",
  description: "Safety resources, issue tracking, and emergency contacts for Compton, CA.",
};

const EMERGENCY_CONTACTS = [
  { label: "Emergency", number: "911", description: "Police, Fire, Ambulance" },
  {
    label: "Compton Station (Non-Emergency)",
    number: "(310) 605-6500",
    description: "LA County Sheriff - Compton Station",
  },
  {
    label: "City Services Hotline",
    number: "(310) 605-5500",
    description: "General city services and information",
  },
  {
    label: "Code Enforcement",
    number: "(310) 605-5530",
    description: "Report code violations",
  },
];

interface DistrictStats {
  district: number;
  total: number;
  open: number;
  resolved: number;
}

export default async function SafetyPage() {
  const supabase = await createClient();

  // Fetch issues aggregated by district and status
  const { data: issues } = await supabase
    .from("city_issues")
    .select("district, status");

  // Aggregate stats
  const districtMap = new Map<number, DistrictStats>();

  if (issues) {
    for (const issue of issues) {
      const d = issue.district ?? 0;
      if (!districtMap.has(d)) {
        districtMap.set(d, { district: d, total: 0, open: 0, resolved: 0 });
      }
      const stats = districtMap.get(d)!;
      stats.total++;
      if (issue.status === "open" || issue.status === "in_progress") {
        stats.open++;
      } else if (issue.status === "resolved" || issue.status === "closed") {
        stats.resolved++;
      }
    }
  }

  const districtStats = Array.from(districtMap.values()).sort(
    (a, b) => a.district - b.district
  );

  const totalIssues = districtStats.reduce((s, d) => s + d.total, 0);
  const totalResolved = districtStats.reduce((s, d) => s + d.resolved, 0);
  const resolutionRate = totalIssues > 0 ? Math.round((totalResolved / totalIssues) * 100) : 0;

  return (
    <div className="culture-surface min-h-dvh">
      <div
        className="px-[18px] pt-5 pb-5"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>§ CITY DATA · SAFETY</div>
        <h1 className="c-hero mt-2" style={{ fontSize: 48, lineHeight: 0.9 }}>Community Safety.</h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          Issue tracking and emergency resources for Compton.
        </p>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="sr-only">
          <SectionHeader
            title="Community Safety"
            subtitle="Issue tracking and emergency resources for Compton"
          />
        </div>

        {/* Resolution Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="c-frame p-5 text-center" style={{ background: "var(--paper-warm)" }}>
            <p className="c-hero" style={{ fontSize: 32, color: "var(--gold-c)" }}>{totalIssues}</p>
            <p className="c-body text-sm">Total Issues</p>
          </div>
          <div className="c-frame p-5 text-center" style={{ background: "var(--paper-warm)" }}>
            <p className="c-hero" style={{ fontSize: 32, color: "var(--ink-strong)" }}>{totalResolved}</p>
            <p className="c-body text-sm">Resolved</p>
          </div>
          <div className="c-frame p-5 text-center" style={{ background: "var(--paper-warm)" }}>
            <p className="c-hero" style={{ fontSize: 32, color: "var(--gold-c)" }}>{resolutionRate}%</p>
            <p className="c-body text-sm">Resolution Rate</p>
          </div>
        </div>

        {/* By District */}
        {districtStats.length > 0 ? (
          <div className="mb-8">
            <h2 className="c-card-t mb-4" style={{ color: "var(--gold-c)" }}>Issues by District</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {districtStats.map((d) => (
                <div key={d.district} className="c-frame p-4" style={{ background: "var(--paper)" }}>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="c-card-t">
                      {d.district === 0 ? "Unassigned" : `District ${d.district}`}
                    </h3>
                    <span className="c-meta text-sm">{d.total} issues</span>
                  </div>
                  <div
                    className="h-2 overflow-hidden"
                    style={{
                      background: "var(--paper-soft)",
                      border: "1.5px solid var(--rule-strong-c)",
                    }}
                  >
                    <div
                      className="h-full transition-all"
                      style={{
                        width: d.total > 0 ? `${(d.resolved / d.total) * 100}%` : "0%",
                        background: "var(--gold-c)",
                      }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between c-meta" style={{ fontSize: 11 }}>
                    <span>{d.open} open</span>
                    <span>{d.resolved} resolved</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-8 c-frame p-8 text-center" style={{ background: "var(--paper-warm)" }}>
            <p className="c-body">No issue data available yet.</p>
            <p className="c-meta mt-1 text-sm">
              Community-reported issues will appear here as they are submitted.
            </p>
          </div>
        )}

        {/* Emergency Contacts */}
        <h2 className="c-card-t mb-4" style={{ color: "var(--gold-c)" }}>Emergency Contacts</h2>
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          {EMERGENCY_CONTACTS.map((contact) => (
            <div key={contact.label} className="c-frame p-4" style={{ background: "var(--paper)" }}>
              <h3 className="c-card-t">{contact.label}</h3>
              <a
                href={`tel:${contact.number.replace(/[^\d]/g, "")}`}
                className="text-lg font-bold hover:underline"
                style={{ color: "var(--gold-c)" }}
              >
                {contact.number}
              </a>
              <p className="c-body text-sm">{contact.description}</p>
            </div>
          ))}
        </div>

        {/* Community Watch */}
        <div className="c-frame p-6 text-center" style={{ background: "var(--paper-warm)" }}>
          <h3 className="c-card-t mb-2 text-lg">Community Watch Groups</h3>
          <p className="c-body text-sm">
            Interested in joining or starting a neighborhood watch?
          </p>
          <p className="c-meta mt-2 text-sm">
            Contact the Compton Station Community Relations office at (310) 605-6500.
          </p>
        </div>
      </div>
    </div>
  );
}
