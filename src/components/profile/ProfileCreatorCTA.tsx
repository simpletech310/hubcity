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

  if (!canTip && !canSubscribe) return null;

  return (
    <div className="space-y-[10px]">
      {canSubscribe && userId && (
        <ChannelSubscribeButton channel={channel} userId={userId} />
      )}

      {canTip && !tipOpen && (
        <button
          type="button"
          onClick={() => setTipOpen(true)}
          className="c-ui press w-full inline-flex items-center justify-center gap-2"
          style={{
            border: "2px solid var(--ink-strong)",
            color: "var(--ink-strong)",
            background: "var(--paper)",
            padding: "11px 0",
          }}
        >
          <Icon name="sparkle" size={14} strokeWidth={2.4} />
          TIP {channel.name.toUpperCase()}
        </button>
      )}

      {canTip && tipOpen && (
        <div
          className="p-3"
          style={{
            border: "2px solid var(--rule-strong-c)",
            background: "var(--paper)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p
              className="c-kicker inline-flex items-center gap-1.5"
              style={{ color: "var(--ink-strong)" }}
            >
              <Icon name="sparkle" size={12} strokeWidth={2.4} />§ LEAVE A TIP
            </p>
            <button
              type="button"
              onClick={() => setTipOpen(false)}
              className="c-kicker press"
              style={{ color: "var(--ink-mute)" }}
              aria-label="Close tip jar"
            >
              CLOSE
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
