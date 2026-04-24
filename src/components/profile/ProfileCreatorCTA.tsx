"use client";

import { useState } from "react";
import TipJar from "@/components/TipJar";
import ChannelSubscribeButton from "@/components/live/ChannelSubscribeButton";
import Icon from "@/components/ui/Icon";
import type { Channel } from "@/types/database";

interface ProfileCreatorCTAProps {
  channel: Channel;
  stripeAccountId: string | null;
  userId: string | null;
  isOwner: boolean;
}

/**
 * Creator-specific CTA cluster that sits inside ProfileHero.
 *
 * Layout:
 *  - Paid Subscribe button (if channel sells subscriptions, and not owner)
 *  - Tip pill (collapsed by default) that expands to the full TipJar on tap
 *
 * Both rely on components already used by /live/channel/[id]; this is just
 * a reskinned composition for the profile hero.
 *
 * Hidden for the channel owner — a creator viewing their own profile sees
 * the Edit/Inbox buttons from ProfileActionButtons instead. The follow and
 * message buttons live in ProfileActionButtons below the hero, so this
 * component focuses purely on monetization CTAs.
 */
export default function ProfileCreatorCTA({
  channel,
  stripeAccountId,
  userId,
  isOwner,
}: ProfileCreatorCTAProps) {
  const [tipOpen, setTipOpen] = useState(false);

  if (isOwner) return null;

  const canTip = !!stripeAccountId;
  const canSubscribe = !!channel.subscription_price_cents && !!userId;

  // Nothing to offer — don't render an empty bar.
  if (!canTip && !canSubscribe) return null;

  return (
    <div className="mt-4 space-y-2.5">
      {canSubscribe && userId && (
        <ChannelSubscribeButton channel={channel} userId={userId} />
      )}

      {canTip && !tipOpen && (
        <button
          type="button"
          onClick={() => setTipOpen(true)}
          className="w-full py-2.5 rounded-xl text-sm font-bold bg-white/[0.04] border border-coral/40 text-coral hover:bg-coral/10 transition-colors press inline-flex items-center justify-center gap-2"
        >
          <Icon name="sparkle" size={14} strokeWidth={2.4} />
          Tip {channel.name}
        </button>
      )}

      {canTip && tipOpen && (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-coral flex items-center gap-1.5">
              <Icon name="sparkle" size={12} strokeWidth={2.4} />
              Leave a tip
            </p>
            <button
              type="button"
              onClick={() => setTipOpen(false)}
              className="text-[11px] text-white/50 press hover:text-white"
              aria-label="Close tip jar"
            >
              Close
            </button>
          </div>
          <TipJar
            channelId={channel.id}
            channelName={channel.name}
            stripeAccountId={stripeAccountId}
          />
        </div>
      )}
    </div>
  );
}
