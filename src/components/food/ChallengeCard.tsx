import type { FoodChallenge } from "@/types/database";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

const typeLabels: Record<string, string> = {
  eating: "Eating Challenge",
  collection: "Collection Challenge",
  photo: "Photo Challenge",
  tasting: "Tasting Tour",
  review: "Review Challenge",
  passport: "Food Passport",
};

const typeIcon: Record<string, IconName> = {
  eating: "trophy",
  collection: "film",
  photo: "camera",
  tasting: "utensils",
  review: "chat",
  passport: "book",
};

export default function ChallengeCard({
  challenge,
}: {
  challenge: FoodChallenge;
}) {
  const startDate = new Date(challenge.start_date)
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
  const endDate = new Date(challenge.end_date)
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();

  const icon = typeIcon[challenge.challenge_type] ?? "trophy";
  const typeLabel = (typeLabels[challenge.challenge_type] ?? challenge.challenge_type).toUpperCase();

  return (
    <div
      className="p-3"
      style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}
    >
      <div className="flex gap-3">
        <div
          className="w-14 h-14 shrink-0 flex items-center justify-center"
          style={{
            background: "var(--ink-strong)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <Icon name={icon} size={24} style={{ color: "var(--gold-c)" }} />
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className="c-card-t truncate"
            style={{ fontSize: 14, color: "var(--ink-strong)" }}
          >
            {challenge.name}
          </h3>

          <div className="flex items-center gap-2 mt-1">
            <span className="c-badge c-badge-gold" style={{ fontSize: 9 }}>
              {typeLabel}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <span
              className="c-kicker inline-flex items-center gap-1"
              style={{ fontSize: 9, opacity: 0.7 }}
            >
              <Icon name="calendar" size={10} /> {startDate} – {endDate}
            </span>
            {challenge.participant_count > 0 && (
              <span
                className="c-kicker inline-flex items-center gap-1"
                style={{ fontSize: 9, opacity: 0.7 }}
              >
                <Icon name="users" size={10} /> {challenge.participant_count}
              </span>
            )}
          </div>

          {challenge.prize_description && (
            <p
              className="c-serif-it mt-2 inline-flex items-center gap-1"
              style={{ fontSize: 12, color: "var(--ink-strong)" }}
            >
              <Icon name="sparkle" size={12} style={{ color: "var(--gold-c)" }} />
              {challenge.prize_description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
