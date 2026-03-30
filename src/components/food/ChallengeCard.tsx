import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { FoodChallenge } from "@/types/database";

const typeLabels: Record<string, string> = {
  eating: "Eating Challenge",
  collection: "Collection Challenge",
  photo: "Photo Challenge",
  tasting: "Tasting Tour",
  review: "Review Challenge",
  passport: "Food Passport",
};

const typeBadgeVariant: Record<string, "coral" | "gold" | "emerald" | "purple"> = {
  eating: "coral",
  collection: "gold",
  photo: "emerald",
  tasting: "gold",
  review: "emerald",
  passport: "purple",
};

export default function ChallengeCard({
  challenge,
}: {
  challenge: FoodChallenge;
}) {
  const startDate = new Date(challenge.start_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endDate = new Date(challenge.end_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <Card hover>
      <div className="flex gap-3">
        {/* Icon */}
        <div className="w-14 h-14 rounded-xl shrink-0 bg-gradient-to-br from-coral/20 to-gold/10 flex items-center justify-center">
          <span className="text-2xl">
            {challenge.challenge_type === "eating"
              ? "🏆"
              : challenge.challenge_type === "collection"
              ? "📸"
              : "⭐"}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-[13px] mb-1 truncate">
            {challenge.name}
          </h3>

          <div className="flex items-center gap-2 mb-1.5">
            <Badge
              label={
                typeLabels[challenge.challenge_type] ??
                challenge.challenge_type
              }
              variant={
                typeBadgeVariant[challenge.challenge_type] ?? "gold"
              }
            />
          </div>

          <div className="flex items-center gap-3 text-[10px] text-txt-secondary">
            <span>
              📅 {startDate} - {endDate}
            </span>
            {challenge.participant_count > 0 && (
              <span>👥 {challenge.participant_count}</span>
            )}
          </div>

          {challenge.prize_description && (
            <p className="text-[11px] text-gold font-semibold mt-1.5">
              🎁 {challenge.prize_description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
