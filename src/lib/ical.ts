/**
 * iCalendar (.ics) file generation utility
 */

function formatICalDate(date: string, time?: string): string {
  // date: YYYY-MM-DD, time: HH:MM or HH:MM:SS
  const d = date.replace(/-/g, "");
  if (!time) return d;
  const t = time.replace(/:/g, "").slice(0, 6).padEnd(6, "0");
  return `${d}T${t}`;
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function generateICalEvent(event: {
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  endDate?: string;
  endTime?: string;
  location?: string;
  url?: string;
}): string {
  const dtStart = formatICalDate(event.startDate, event.startTime);
  const dtEnd = event.endDate
    ? formatICalDate(event.endDate, event.endTime)
    : event.endTime
      ? formatICalDate(event.startDate, event.endTime)
      : null;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hub City//Events//EN",
    "BEGIN:VEVENT",
    `DTSTART:${dtStart}`,
  ];

  if (dtEnd) {
    lines.push(`DTEND:${dtEnd}`);
  }

  lines.push(`SUMMARY:${escapeICalText(event.title)}`);

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeICalText(event.location)}`);
  }

  if (event.url) {
    lines.push(`URL:${event.url}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}
