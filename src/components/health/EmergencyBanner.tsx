import Link from "next/link";
import Icon from "@/components/ui/Icon";

/**
 * Emergency banner — ink body, gold foil accent, 3px ink frame. High
 * contrast and urgent on the newsprint canvas. Keep this loud.
 */
export default function EmergencyBanner() {
  return (
    <div
      className="mx-5 mb-5 relative overflow-hidden"
      style={{
        background: "var(--ink-strong)",
        border: "3px solid var(--rule-strong-c)",
      }}
    >
      {/* Gold foil bar top */}
      <div style={{ height: 4, background: "var(--gold-c)" }} />

      <div className="px-4 pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 flex items-center justify-center shrink-0"
            style={{
              background: "var(--gold-c)",
              color: "var(--ink-strong)",
              border: "2px solid var(--paper)",
            }}
          >
            <Icon name="alert" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="c-kicker"
              style={{ fontSize: 10, color: "var(--gold-c)", letterSpacing: "0.18em" }}
            >
              § EMERGENCY · DIAL 911
            </p>
            <p
              className="c-serif-it mt-1"
              style={{ fontSize: 12, color: "var(--paper)", opacity: 0.8 }}
            >
              Crisis hotline:{" "}
              <a href="tel:988" style={{ color: "var(--gold-c)", fontWeight: 700 }}>
                988
              </a>{" "}
              (Suicide &amp; Crisis Lifeline)
            </p>
          </div>
          <a
            href="tel:911"
            className="c-btn c-btn-sm shrink-0 press"
            style={{
              background: "var(--gold-c)",
              color: "var(--ink-strong)",
              border: "2px solid var(--paper)",
            }}
          >
            CALL 911
          </a>
        </div>

        <Link
          href="/health/emergency"
          className="flex items-center justify-center gap-1.5 mt-3 pt-3 c-kicker press"
          style={{
            borderTop: "1px dashed var(--gold-c)",
            fontSize: 10,
            color: "var(--gold-c)",
            letterSpacing: "0.14em",
          }}
        >
          VIEW ALL EMERGENCY RESOURCES
          <svg
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M4 2l4 4-4 4" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
