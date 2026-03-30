import type { Event } from "@/types/database";

const TICKET_CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateTicketCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += TICKET_CODE_CHARS.charAt(
      Math.floor(Math.random() * TICKET_CODE_CHARS.length)
    );
  }
  return code;
}

export function isTicketSalesOpen(event: Event): boolean {
  const now = new Date();
  if (event.ticket_sales_start && new Date(event.ticket_sales_start) > now)
    return false;
  if (event.ticket_sales_end && new Date(event.ticket_sales_end) < now)
    return false;
  return true;
}

export function getTicketSalesMessage(event: Event): string | null {
  const now = new Date();

  if (event.ticket_sales_start) {
    const start = new Date(event.ticket_sales_start);
    if (start > now) {
      const diff = start.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days > 0) return `Sales start in ${days}d`;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours > 0) return `Sales start in ${hours}h`;
      const mins = Math.floor(diff / (1000 * 60));
      return `Sales start in ${mins}m`;
    }
  }

  if (event.ticket_sales_end) {
    const end = new Date(event.ticket_sales_end);
    if (end > now) {
      const diff = end.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days > 0) return `Sales end in ${days}d`;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours > 0) return `Sales end in ${hours}h`;
      const mins = Math.floor(diff / (1000 * 60));
      return `Sales end in ${mins}m`;
    }
    return "Sales ended";
  }

  return null;
}
