import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ChallengeCard from "@/components/food/ChallengeCard";
import type { FoodChallenge } from "@/types/database";

export default async function FoodChallengesPage() {
  const supabase = await createClient();

  const { data: challenges } = await supabase
    .from("food_challenges")
    .select("*")
    .eq("is_active", true)
    .gte("end_date", new Date().toISOString().split("T")[0])
    .order("start_date", { ascending: true });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-4 mb-5">
        <Link
          href="/food"
          className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press mb-3"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
          Food
        </Link>
        <h1 className="font-heading text-2xl font-bold mb-1">
          Food Challenges
        </h1>
        <p className="text-sm text-txt-secondary">
          Compete, eat, and win prizes
        </p>
      </div>

      {/* Challenges list */}
      <div className="px-5 space-y-3">
        {(challenges as FoodChallenge[] | null)?.length ? (
          (challenges as FoodChallenge[]).map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))
        ) : (
          <div className="text-center py-16">
            <span className="text-5xl block mb-3">🏆</span>
            <p className="text-sm font-medium mb-1">No active challenges</p>
            <p className="text-xs text-txt-secondary">
              New food challenges are coming soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
