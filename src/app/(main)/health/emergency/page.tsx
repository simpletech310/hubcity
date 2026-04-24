import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

const crisisHotlines: {
  name: string;
  number: string;
  description: string;
  icon: IconName;
}[] = [
  {
    name: "Suicide & Crisis Lifeline",
    number: "988",
    description: "24/7 free and confidential support",
    icon: "alert",
  },
  {
    name: "Poison Control",
    number: "1-800-222-1222",
    description: "Immediate poison emergency help",
    icon: "alert",
  },
  {
    name: "National Domestic Violence Hotline",
    number: "1-800-799-7233",
    description: "24/7 confidential support for abuse victims",
    icon: "shield",
  },
  {
    name: "SAMHSA Helpline",
    number: "1-800-662-4357",
    description: "Substance abuse & mental health referrals",
    icon: "phone",
  },
  {
    name: "Crisis Text Line",
    number: "Text HOME to 741741",
    description: "Free 24/7 crisis text support",
    icon: "chat",
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
    <div className="culture-surface min-h-dvh animate-fade-in pb-safe">
      {/* Back Button */}
      <div className="px-5 pt-4 mb-3">
        <Link
          href="/health"
          className="c-kicker inline-flex items-center gap-1.5 press"
          style={{ fontSize: 11, color: "var(--ink-strong)", letterSpacing: "0.14em" }}
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
          HEALTH DIRECTORY
        </Link>
      </div>

      <div
        className="px-[18px] pt-2 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>
          § VOL·01 · ISSUE EMERGENCY
        </div>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 48, lineHeight: 0.9, letterSpacing: "-0.02em" }}
        >
          Emergency.
        </h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          Immediate help when you need it most.
        </p>
      </div>

      <div className="px-5 mt-5">
        {/* Big 911 Button */}
        <a
          href="tel:911"
          className="block mb-6 p-6 text-center relative overflow-hidden press"
          style={{
            background: "var(--ink-strong)",
            border: "3px solid var(--rule-strong-c)",
          }}
        >
          <div style={{ height: 4, background: "var(--gold-c)", marginTop: -24, marginLeft: -24, marginRight: -24, marginBottom: 16 }} />
          <div
            className="mx-auto w-14 h-14 flex items-center justify-center mb-3"
            style={{
              background: "var(--gold-c)",
              color: "var(--ink-strong)",
              border: "3px solid var(--paper)",
            }}
          >
            <Icon name="alert" size={28} />
          </div>
          <p
            className="c-hero"
            style={{ fontSize: 44, lineHeight: 0.95, color: "var(--paper)" }}
          >
            CALL 911
          </p>
          <p
            className="c-serif-it mt-2"
            style={{ fontSize: 13, color: "var(--paper)", opacity: 0.8 }}
          >
            For life-threatening emergencies.
          </p>
          <div
            className="mt-4 inline-flex items-center gap-2 c-btn c-btn-sm"
            style={{
              background: "var(--gold-c)",
              color: "var(--ink-strong)",
              border: "2px solid var(--paper)",
            }}
          >
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72" />
            </svg>
            TAP TO CALL
          </div>
        </a>

        {/* Crisis Hotlines */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <span
              className="c-hero tabular-nums"
              style={{ fontSize: 22, lineHeight: 1, color: "var(--gold-c)" }}
            >
              № 01
            </span>
            <span className="c-kicker" style={{ fontSize: 10, letterSpacing: "0.16em" }}>
              CRISIS HOTLINES
            </span>
            <span
              className="ml-auto flex-1 self-center"
              style={{ borderTop: "2px solid var(--rule-strong-c)" }}
            />
          </div>
          <div className="space-y-2.5">
            {crisisHotlines.map((hotline) => (
              <div
                key={hotline.name}
                className="p-3"
                style={{
                  background: "var(--paper)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 flex items-center justify-center shrink-0"
                    style={{
                      background: "var(--ink-strong)",
                      color: "var(--gold-c)",
                      border: "2px solid var(--rule-strong-c)",
                    }}
                  >
                    <Icon name={hotline.icon} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="c-card-t" style={{ fontSize: 13 }}>{hotline.name}</p>
                    <p className="c-meta mt-0.5" style={{ fontSize: 11 }}>{hotline.description}</p>
                  </div>
                  {hotline.number.startsWith("Text") ? (
                    <span
                      className="c-badge-ink c-kicker shrink-0"
                      style={{ fontSize: 10, padding: "4px 10px", letterSpacing: "0.14em" }}
                    >
                      TEXT
                    </span>
                  ) : (
                    <a
                      href={`tel:${hotline.number.replace(/[^0-9]/g, "")}`}
                      className="c-badge-gold c-kicker shrink-0 press"
                      style={{ fontSize: 11, padding: "5px 10px", letterSpacing: "0.08em" }}
                    >
                      {hotline.number}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nearest Hospitals */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <span
              className="c-hero tabular-nums"
              style={{ fontSize: 22, lineHeight: 1, color: "var(--gold-c)" }}
            >
              № 02
            </span>
            <span className="c-kicker" style={{ fontSize: 10, letterSpacing: "0.16em" }}>
              NEAREST HOSPITALS
            </span>
            <span
              className="ml-auto flex-1 self-center"
              style={{ borderTop: "2px solid var(--rule-strong-c)" }}
            />
          </div>
          <div className="space-y-2.5">
            {nearbyHospitals.map((hospital) => (
              <div
                key={hospital.name}
                className="p-4"
                style={{
                  background: "var(--paper)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <div className="mb-2.5">
                  <h3 className="c-card-t" style={{ fontSize: 14 }}>{hospital.name}</h3>
                  <p
                    className="c-kicker mt-1"
                    style={{ fontSize: 9, color: "var(--gold-c)", letterSpacing: "0.14em" }}
                  >
                    {hospital.note.toUpperCase()}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(hospital.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                    style={{ fontSize: 12, color: "var(--ink-strong)" }}
                  >
                    <Icon name="pin" size={14} style={{ color: "var(--gold-c)" }} />
                    {hospital.address}
                  </a>
                  <a
                    href={`tel:${hospital.phone.replace(/[^0-9]/g, "")}`}
                    className="flex items-center gap-2"
                    style={{ fontSize: 12, color: "var(--ink-strong)", fontWeight: 500 }}
                  >
                    <Icon name="phone" size={14} style={{ color: "var(--gold-c)" }} />
                    {hospital.phone}
                  </a>
                </div>
                <div
                  className="mt-3 pt-3 flex gap-2"
                  style={{ borderTop: "2px solid var(--rule-strong-c)" }}
                >
                  <a
                    href={`tel:${hospital.phone.replace(/[^0-9]/g, "")}`}
                    className="c-btn c-btn-primary c-btn-sm flex-1 press text-center"
                  >
                    CALL
                  </a>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(hospital.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="c-btn c-btn-outline c-btn-sm flex-1 press text-center"
                  >
                    DIRECTIONS
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mental Health Crisis */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <span
              className="c-hero tabular-nums"
              style={{ fontSize: 22, lineHeight: 1, color: "var(--gold-c)" }}
            >
              № 03
            </span>
            <span className="c-kicker" style={{ fontSize: 10, letterSpacing: "0.16em" }}>
              MENTAL HEALTH CRISIS
            </span>
            <span
              className="ml-auto flex-1 self-center"
              style={{ borderTop: "2px solid var(--rule-strong-c)" }}
            />
          </div>
          <div className="space-y-2.5">
            {mentalHealthResources.map((resource) => (
              <div
                key={resource.name}
                className="p-3"
                style={{
                  background: "var(--paper)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="c-card-t" style={{ fontSize: 13 }}>{resource.name}</p>
                    <p className="c-meta mt-0.5" style={{ fontSize: 11 }}>{resource.description}</p>
                  </div>
                  <a
                    href={`tel:${resource.number.replace(/[^0-9]/g, "")}`}
                    className="c-badge-gold c-kicker shrink-0 press"
                    style={{ fontSize: 11, padding: "5px 10px", letterSpacing: "0.08em" }}
                  >
                    {resource.number}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Link back to full directory */}
        <div className="mb-6">
          <Link href="/health" className="block press">
            <div
              className="text-center py-6 px-5 relative overflow-hidden"
              style={{
                background: "var(--ink-strong)",
                border: "3px solid var(--rule-strong-c)",
              }}
            >
              <div style={{ height: 4, background: "var(--gold-c)", marginTop: -24, marginLeft: -20, marginRight: -20, marginBottom: 16 }} />
              <div
                className="mx-auto w-12 h-12 flex items-center justify-center mb-3"
                style={{
                  background: "var(--gold-c)",
                  color: "var(--ink-strong)",
                  border: "2px solid var(--paper)",
                }}
              >
                <Icon name="heart-pulse" size={24} />
              </div>
              <h3
                className="c-hero"
                style={{ fontSize: 22, lineHeight: 1, color: "var(--paper)" }}
              >
                Full Health Directory.
              </h3>
              <p
                className="c-serif-it mt-2 mb-4 max-w-[260px] mx-auto"
                style={{ fontSize: 12, color: "var(--paper)", opacity: 0.8 }}
              >
                Browse clinics, dental, mental health, pharmacy, and more healthcare resources in Compton.
              </p>
              <span
                className="c-btn c-btn-sm inline-flex"
                style={{
                  background: "var(--gold-c)",
                  color: "var(--ink-strong)",
                  border: "2px solid var(--paper)",
                }}
              >
                BROWSE ALL HEALTH RESOURCES
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
