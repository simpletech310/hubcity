import {
  sendEmail,
  notificationEmailTemplate,
} from "@/lib/email";

const BASE_URL = "https://knect.app";

/**
 * Welcome email when a user signs up
 */
export async function sendWelcomeEmail(
  email: string,
  displayName: string
): Promise<void> {
  try {
    const html = notificationEmailTemplate(
      `Welcome to Knect, ${displayName}!`,
      "You're now part of Compton's digital town hall. Explore local businesses, stay updated on city events, report issues in your neighborhood, and connect with your community.",
      `${BASE_URL}/feed`,
      "Explore Knect"
    );

    await sendEmail({
      to: email,
      subject: `Welcome to Knect, ${displayName}!`,
      html,
    });
  } catch (error) {
    console.error("[EmailNotification] Welcome email failed:", error);
  }
}

/**
 * Broadcast notification email (system or district announcements)
 */
export async function sendBroadcastEmail(
  email: string,
  title: string,
  body: string
): Promise<void> {
  try {
    const html = notificationEmailTemplate(
      title,
      body,
      `${BASE_URL}/notifications`,
      "View Notifications"
    );

    await sendEmail({
      to: email,
      subject: `Knect: ${title}`,
      html,
    });
  } catch (error) {
    console.error("[EmailNotification] Broadcast email failed:", error);
  }
}

/**
 * Issue status update notification
 */
export async function sendIssueStatusEmail(
  email: string,
  issueTitle: string,
  newStatus: string,
  issueId: string
): Promise<void> {
  try {
    const statusLabels: Record<string, string> = {
      reported: "Reported",
      acknowledged: "Acknowledged",
      in_progress: "In Progress",
      resolved: "Resolved",
      closed: "Closed",
    };

    const statusLabel = statusLabels[newStatus] || newStatus;

    const html = notificationEmailTemplate(
      `Issue Update: ${statusLabel}`,
      `Your reported issue "${issueTitle}" has been updated to "${statusLabel}". Thank you for helping improve our community.`,
      `${BASE_URL}/city-hall/issues/${issueId}`,
      "View Issue"
    );

    await sendEmail({
      to: email,
      subject: `Issue Update: ${issueTitle} — ${statusLabel}`,
      html,
    });
  } catch (error) {
    console.error("[EmailNotification] Issue status email failed:", error);
  }
}

/**
 * Event reminder email (sent 24 hours before an event)
 */
export async function sendEventReminderEmail(
  email: string,
  eventTitle: string,
  eventDate: string,
  eventId: string
): Promise<void> {
  try {
    const html = notificationEmailTemplate(
      `Reminder: ${eventTitle}`,
      `Don't forget — "${eventTitle}" is happening tomorrow, ${eventDate}. We hope to see you there!`,
      `${BASE_URL}/events/${eventId}`,
      "View Event Details"
    );

    await sendEmail({
      to: email,
      subject: `Reminder: ${eventTitle} is tomorrow!`,
      html,
    });
  } catch (error) {
    console.error("[EmailNotification] Event reminder email failed:", error);
  }
}

/**
 * Order status update notification
 */
export async function sendOrderStatusEmail(
  email: string,
  orderNumber: string,
  newStatus: string,
  orderId: string
): Promise<void> {
  try {
    const statusLabels: Record<string, string> = {
      pending: "Pending",
      confirmed: "Confirmed",
      preparing: "Being Prepared",
      ready: "Ready for Pickup",
      completed: "Completed",
      cancelled: "Cancelled",
    };

    const statusLabel = statusLabels[newStatus] || newStatus;

    const html = notificationEmailTemplate(
      `Order ${orderNumber}: ${statusLabel}`,
      `Your order #${orderNumber} status has been updated to "${statusLabel}". Check your order details for more information.`,
      `${BASE_URL}/orders/${orderId}`,
      "View Order"
    );

    await sendEmail({
      to: email,
      subject: `Order #${orderNumber} — ${statusLabel}`,
      html,
    });
  } catch (error) {
    console.error("[EmailNotification] Order status email failed:", error);
  }
}

/**
 * Badge earned notification
 */
export async function sendBadgeEarnedEmail(
  email: string,
  badgeName: string,
  badgeIcon: string
): Promise<void> {
  try {
    const html = notificationEmailTemplate(
      `${badgeIcon} Badge Earned: ${badgeName}`,
      `Congratulations! You've earned the "${badgeName}" badge on Knect. Keep engaging with your community to unlock more achievements!`,
      `${BASE_URL}/profile`,
      "View Your Badges"
    );

    await sendEmail({
      to: email,
      subject: `You earned the ${badgeName} badge!`,
      html,
    });
  } catch (error) {
    console.error("[EmailNotification] Badge earned email failed:", error);
  }
}
