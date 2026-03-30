import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const crisisHotlines = [
  {
    name: "Suicide & Crisis Lifeline",
    number: "988",
    description: "24/7 free and confidential support",
    icon: "💙",
  },
  {
    name: "Poison Control",
    number: "1-800-222-1222",
    description: "Immediate poison emergency help",
    icon: "☠️",
  },
  {
    name: "National Domestic Violence Hotline",
    number: "1-800-799-7233",
    description: "24/7 confidential support for abuse victims",
    icon: "🛡️",
  },
  {
    name: "SAMHSA Helpline",
    number: "1-800-662-4357",
    description: "Substance abuse & mental health referrals",
    icon: "💚",
  },
  {
    name: "Crisis Text Line",
    number: "Text HOME to 741741",
    description: "Free 24/7 crisis text support",
    icon: "💬",
  },
];

const nearbyHospitals = [
  {
    name: "Martin Luther King Jr. Community Hospital",
    address: "1680 E 120th St, Los Angeles, CA 90059",
    phone: "(424) 338-8000",
    note: "Closest full-service hospital to Compton",
  },
  {
    name: "St. Francis Medical Center",
    address: "3630 Imperial Hwy, Lynwood, CA 90262",
    phone: "(310) 900-8900",
    note: "Level II Trauma Center",
  },
  {
    name: "Long Beach Medical Center",
    address: "2801 Atlantic Ave, Long Beach, CA 90806",
    phone: "(562) 933-2000",
    note: "Full emergency department",
  },
];

const mentalHealthResources = [
  {
    name: "LA County DMH Access Hotline",
    number: "1-800-854-7771",
    description: "24/7 mental health crisis line for LA County",
  },
  {
    name: "Didi Hirsch Mental Health Services",
    number: "(800) 854-7771",
    description: "Crisis intervention and suicide prevention",
  },
  {
    name: "NAMI Helpline",
    number: "1-800-950-6264",
    description: "Mental health information and referrals",
  },
];

export default function EmergencyPage() {
  return (
    <div className="animate-fade-in">
      {/* Back Button */}
      <div className="px-5 pt-4 mb-3">
        <Link
          href="/health"
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
          Health Directory
        </Link>
      </div>

      <div className="px-5">
        {/* Header */}
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-bold mb-1">Emergency Resources</h1>
          <p className="text-sm text-txt-secondary">
            Immediate help when you need it most
          </p>
        </div>

        {/* Big 911 Button */}
        <a
          href="tel:911"
          className="block mb-6 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 p-6 text-center relative overflow-hidden press"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
          <div className="relative">
            <span className="text-5xl block mb-3">🚨</span>
            <p className="text-3xl font-display font-bold text-white mb-1">
              Call 911
            </p>
            <p className="text-sm text-white/80">
              For life-threatening emergencies
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-full px-5 py-2.5">
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72" />
              </svg>
              <span className="text-white font-bold text-sm">Tap to Call</span>
            </div>
          </div>
        </a>

        {/* Crisis Hotlines */}
        <div className="mb-6">
          <h2 className="font-heading font-bold text-lg mb-3 flex items-center gap-2">
            <span>📞</span> Crisis Hotlines
          </h2>
          <div className="space-y-2.5">
            {crisisHotlines.map((hotline) => (
              <Card key={hotline.name} hover>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] flex items-center justify-center text-lg shrink-0 border border-border-subtle">
                    {hotline.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[13px] mb-0.5">{hotline.name}</p>
                    <p className="text-[11px] text-txt-secondary">
                      {hotline.description}
                    </p>
                  </div>
                  {hotline.number.startsWith("Text") ? (
                    <div className="shrink-0">
                      <Badge label="Text" variant="cyan" size="md" />
                    </div>
                  ) : (
                    <a
                      href={`tel:${hotline.number.replace(/[^0-9]/g, "")}`}
                      className="shrink-0 bg-gold/15 text-gold border border-gold/20 rounded-full px-3 py-1.5 text-[11px] font-bold press"
                    >
                      {hotline.number}
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Nearest Hospitals */}
        <div className="mb-6">
          <h2 className="font-heading font-bold text-lg mb-3 flex items-center gap-2">
            <span>🏨</span> Nearest Hospitals
          </h2>
          <div className="space-y-2.5">
            {nearbyHospitals.map((hospital) => (
              <Card key={hospital.name}>
                <div className="mb-2.5">
                  <h3 className="font-heading font-bold text-[13px] mb-0.5">
                    {hospital.name}
                  </h3>
                  <Badge label={hospital.note} variant="purple" />
                </div>
                <div className="space-y-2">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(hospital.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[12px] text-gold font-medium"
                  >
                    <span>📍</span>
                    {hospital.address}
                  </a>
                  <a
                    href={`tel:${hospital.phone.replace(/[^0-9]/g, "")}`}
                    className="flex items-center gap-2 text-[12px] text-gold font-medium"
                  >
                    <span>📞</span>
                    {hospital.phone}
                  </a>
                </div>
                <div className="mt-3 pt-3 border-t border-border-subtle flex gap-2">
                  <a
                    href={`tel:${hospital.phone.replace(/[^0-9]/g, "")}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gold text-midnight py-2 rounded-full text-xs font-bold press"
                  >
                    Call
                  </a>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(hospital.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 text-white py-2 rounded-full text-xs font-medium press border border-white/10"
                  >
                    Directions
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Mental Health Crisis */}
        <div className="mb-6">
          <h2 className="font-heading font-bold text-lg mb-3 flex items-center gap-2">
            <span>🧠</span> Mental Health Crisis
          </h2>
          <div className="space-y-2.5">
            {mentalHealthResources.map((resource) => (
              <Card key={resource.name} hover>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[13px] mb-0.5">{resource.name}</p>
                    <p className="text-[11px] text-txt-secondary">
                      {resource.description}
                    </p>
                  </div>
                  <a
                    href={`tel:${resource.number.replace(/[^0-9]/g, "")}`}
                    className="shrink-0 bg-hc-purple/15 text-hc-purple border border-hc-purple/20 rounded-full px-3 py-1.5 text-[11px] font-bold press"
                  >
                    {resource.number}
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Link back to full directory */}
        <div className="mb-6">
          <Link href="/health">
            <Card
              glow
              className="border-gold/15 text-center py-5 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
              <span className="text-3xl block mb-2">🏥</span>
              <h3 className="font-heading font-bold text-base mb-1">
                Full Health Directory
              </h3>
              <p className="text-[12px] text-txt-secondary mb-3 max-w-[260px] mx-auto">
                Browse clinics, dental, mental health, pharmacy, and more
                healthcare resources in Compton.
              </p>
              <span className="inline-flex items-center gap-2 bg-gold text-midnight px-5 py-2.5 rounded-full text-xs font-bold">
                Browse All Health Resources
              </span>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
