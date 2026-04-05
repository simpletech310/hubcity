import { createClient } from "@/lib/supabase/server";
import SectionHeader from "@/components/layout/SectionHeader";

export const metadata = {
  title: "Community Safety - Hub City",
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
    <div className="min-h-screen bg-midnight text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <SectionHeader
          title="Community Safety"
          subtitle="Issue tracking and emergency resources for Compton"
        />

        {/* Resolution Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-royal p-5 text-center">
            <p className="text-3xl font-bold text-gold">{totalIssues}</p>
            <p className="text-sm text-white/60">Total Issues</p>
          </div>
          <div className="rounded-2xl bg-royal p-5 text-center">
            <p className="text-3xl font-bold text-emerald-400">{totalResolved}</p>
            <p className="text-sm text-white/60">Resolved</p>
          </div>
          <div className="rounded-2xl bg-royal p-5 text-center">
            <p className="text-3xl font-bold text-gold">{resolutionRate}%</p>
            <p className="text-sm text-white/60">Resolution Rate</p>
          </div>
        </div>

        {/* By District */}
        {districtStats.length > 0 ? (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-gold">Issues by District</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {districtStats.map((d) => (
                <div key={d.district} className="rounded-2xl bg-royal p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold">
                      {d.district === 0 ? "Unassigned" : `District ${d.district}`}
                    </h3>
                    <span className="text-sm text-white/50">{d.total} issues</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all"
                      style={{
                        width: d.total > 0 ? `${(d.resolved / d.total) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-white/50">
                    <span>{d.open} open</span>
                    <span>{d.resolved} resolved</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-8 rounded-2xl bg-royal/50 p-8 text-center">
            <p className="text-white/50">No issue data available yet.</p>
            <p className="mt-1 text-sm text-white/30">
              Community-reported issues will appear here as they are submitted.
            </p>
          </div>
        )}

        {/* Emergency Contacts */}
        <h2 className="mb-4 text-xl font-semibold text-gold">Emergency Contacts</h2>
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          {EMERGENCY_CONTACTS.map((contact) => (
            <div key={contact.label} className="rounded-2xl bg-royal p-4">
              <h3 className="font-semibold">{contact.label}</h3>
              <a
                href={`tel:${contact.number.replace(/[^\d]/g, "")}`}
                className="text-lg font-bold text-gold hover:underline"
              >
                {contact.number}
              </a>
              <p className="text-sm text-white/50">{contact.description}</p>
            </div>
          ))}
        </div>

        {/* Community Watch */}
        <div className="rounded-2xl bg-royal/50 p-6 text-center">
          <h3 className="mb-2 text-lg font-semibold">Community Watch Groups</h3>
          <p className="text-sm text-white/60">
            Interested in joining or starting a neighborhood watch?
          </p>
          <p className="mt-2 text-sm text-white/40">
            Contact the Compton Station Community Relations office at (310) 605-6500.
          </p>
        </div>
      </div>
    </div>
  );
}
