/**
 * Live "Open now" / "Closed — opens 9am Wed" status pill. Pure server
 * helper that takes a `hours` map keyed by `mon`/`tue`/.../`sun` and a
 * `{ open, close }` object (or string fallback). Times are interpreted
 * in the viewer's locale — good enough for the Compton-area MVP. Future
 * iteration can plumb business timezone through.
 */

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DAY_LABELS: Record<string, string> = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
};

type HoursValue = string | { open: string; close: string } | undefined | null;
type HoursMap = Record<string, HoursValue> | null | undefined;

function parseTime(s: string): { h: number; m: number } | null {
  // Accepts "9:00", "09:00", "9", "9:00am", "9am", "21:00".
  const trimmed = s.trim().toLowerCase();
  const ampm = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  const military = trimmed.match(/^(\d{1,2})(?::(\d{2}))?$/);
  let h: number, m: number;
  if (ampm) {
    h = Number(ampm[1]);
    m = ampm[2] ? Number(ampm[2]) : 0;
    if (ampm[3] === "pm" && h !== 12) h += 12;
    if (ampm[3] === "am" && h === 12) h = 0;
  } else if (military) {
    h = Number(military[1]);
    m = military[2] ? Number(military[2]) : 0;
  } else {
    return null;
  }
  if (h < 0 || h > 24 || m < 0 || m > 59) return null;
  return { h, m };
}

function formatTime(h: number, m: number): string {
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: m === 0 ? undefined : "2-digit",
  });
}

interface ParsedHours {
  open: { h: number; m: number };
  close: { h: number; m: number };
}

function parseDay(value: HoursValue): ParsedHours | null {
  if (!value) return null;
  if (typeof value === "object") {
    const open = parseTime(value.open);
    const close = parseTime(value.close);
    if (!open || !close) return null;
    return { open, close };
  }
  // String form — try "9:00 - 17:00" or "9am – 5pm".
  const parts = value.split(/[-–—]/);
  if (parts.length !== 2) return null;
  const open = parseTime(parts[0]);
  const close = parseTime(parts[1]);
  if (!open || !close) return null;
  return { open, close };
}

function nowMinutes(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

function asMinutes(t: { h: number; m: number }): number {
  return t.h * 60 + t.m;
}

export interface OpenStatus {
  state: "open" | "closing-soon" | "closed";
  /** Short label suitable for a badge: "Open now", "Closes 9pm", "Closed". */
  label: string;
  /** Helper subtext: "until 9pm" or "Opens 9am Tue". Null when redundant. */
  subtext: string | null;
}

export function getOpenStatus(hours: HoursMap, now: Date = new Date()): OpenStatus | null {
  if (!hours) return null;
  const today = DAY_KEYS[now.getDay()];
  const todayHours = parseDay(hours[today]);
  const minsNow = nowMinutes(now);

  if (todayHours) {
    const openMin = asMinutes(todayHours.open);
    const closeMin = asMinutes(todayHours.close);
    if (minsNow >= openMin && minsNow < closeMin) {
      const minutesLeft = closeMin - minsNow;
      if (minutesLeft <= 60) {
        return {
          state: "closing-soon",
          label: `Closes ${formatTime(todayHours.close.h, todayHours.close.m)}`,
          subtext: `in ${minutesLeft} min`,
        };
      }
      return {
        state: "open",
        label: "Open now",
        subtext: `until ${formatTime(todayHours.close.h, todayHours.close.m)}`,
      };
    }
    if (minsNow < openMin) {
      return {
        state: "closed",
        label: "Closed",
        subtext: `Opens ${formatTime(todayHours.open.h, todayHours.open.m)}`,
      };
    }
  }

  // Find next open day within the next 7.
  for (let offset = 1; offset <= 7; offset++) {
    const next = DAY_KEYS[(now.getDay() + offset) % 7];
    const nextHours = parseDay(hours[next]);
    if (nextHours) {
      const dayLabel = offset === 1 ? "tomorrow" : DAY_LABELS[next];
      return {
        state: "closed",
        label: "Closed",
        subtext: `Opens ${formatTime(nextHours.open.h, nextHours.open.m)} ${dayLabel}`,
      };
    }
  }

  return { state: "closed", label: "Closed", subtext: null };
}

export default function OpenNowBadge({ hours }: { hours: HoursMap }) {
  const status = getOpenStatus(hours);
  if (!status) return null;
  const isOpen = status.state === "open";
  const isWarn = status.state === "closing-soon";
  const dotClass = isOpen ? "bg-emerald" : isWarn ? "bg-gold" : "bg-coral";
  const textClass = isOpen ? "text-emerald" : isWarn ? "text-gold" : "text-coral";
  const bgClass = isOpen
    ? "bg-emerald/15 border-emerald/20"
    : isWarn
      ? "bg-gold/15 border-gold/20"
      : "bg-coral/10 border-coral/20";
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${bgClass}`}
      title={status.subtext ?? undefined}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${dotClass} ${isOpen ? "animate-pulse" : ""}`} />
      <span className={`text-[10px] font-bold ${textClass}`}>{status.label}</span>
      {status.subtext && (
        <span className="text-[10px] text-txt-secondary">· {status.subtext}</span>
      )}
    </div>
  );
}
