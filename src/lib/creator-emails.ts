// Creator-facing transactional emails. Thin wrappers over the existing
// SendGrid utility so the webhook handler stays focused on Stripe state.
import { sendEmail, notificationEmailTemplate } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://knect.app";

function formatCurrency(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

async function userEmail(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  try {
    const { data } = await admin.auth.admin.getUserById(userId);
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

async function channelName(channelId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("channels")
    .select("name")
    .eq("id", channelId)
    .maybeSingle();
  return data?.name ?? "your channel";
}

async function videoTitle(videoId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("channel_videos")
    .select("title")
    .eq("id", videoId)
    .maybeSingle();
  return data?.title ?? "your video";
}

interface NewSubscriberArgs {
  creatorId: string;
  channelId: string;
  subscriberId: string;
  amountCents: number;
}

/**
 * Email the creator that someone just subscribed to their channel.
 */
export async function notifyCreatorOfNewSubscriber(
  args: NewSubscriberArgs
): Promise<void> {
  const [email, channel] = await Promise.all([
    userEmail(args.creatorId),
    channelName(args.channelId),
  ]);
  if (!email) return;

  const html = notificationEmailTemplate(
    "You earned a new subscriber",
    `Someone just subscribed to ${channel} for ${formatCurrency(
      args.amountCents
    )}/month. Your earnings dashboard has the details.`,
    `${BASE_URL}/dashboard/creator/earnings`,
    "View Earnings"
  );

  await sendEmail({
    to: email,
    subject: `New subscriber on ${channel}`,
    html,
  });
}

interface PpvPurchaseArgs {
  creatorId: string;
  videoId: string;
  buyerId: string;
  amountCents: number;
}

/**
 * Email the creator that someone bought one of their videos.
 */
export async function notifyCreatorOfPpvPurchase(
  args: PpvPurchaseArgs
): Promise<void> {
  const [email, title] = await Promise.all([
    userEmail(args.creatorId),
    videoTitle(args.videoId),
  ]);
  if (!email) return;

  const html = notificationEmailTemplate(
    "Cha-ching — your video sold",
    `A viewer just bought "${title}" for ${formatCurrency(args.amountCents)}.`,
    `${BASE_URL}/dashboard/creator/earnings`,
    "View Earnings"
  );

  await sendEmail({
    to: email,
    subject: `New purchase: ${title}`,
    html,
  });
}

interface RenewalArgs {
  subscriberId: string;
  channelId: string;
  amountCents: number;
  isFirst: boolean;
}

/**
 * Confirm a subscription payment to the viewer (first time or renewal).
 */
export async function notifySubscriberOfRenewal(args: RenewalArgs): Promise<void> {
  const [email, channel] = await Promise.all([
    userEmail(args.subscriberId),
    channelName(args.channelId),
  ]);
  if (!email) return;

  const subject = args.isFirst
    ? `Welcome to ${channel}`
    : `Renewal confirmed — ${channel}`;
  const body = args.isFirst
    ? `Your subscription to ${channel} is active. Thanks for supporting the creator. We charged ${formatCurrency(
        args.amountCents
      )} today.`
    : `Your subscription to ${channel} just renewed for ${formatCurrency(
        args.amountCents
      )}. Manage your subscriptions any time from your profile.`;

  const html = notificationEmailTemplate(
    subject,
    body,
    `${BASE_URL}/profile/subscriptions`,
    "Manage Subscriptions"
  );

  await sendEmail({ to: email, subject, html });
}
