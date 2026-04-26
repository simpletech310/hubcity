import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ChallengeCard from "@/components/food/ChallengeCard";
import type { FoodChallenge } from "@/types/database";
import Icon from "@/components/ui/Icon";

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
          className="inline-flex items-center gap-1.5 press mb-3 c-kicker"
          style={{ color: "var(--ink-strong)" }}
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
        <h1 className="c-hero mb-1" style={{ fontSize: "1.75rem", color: "var(--ink-strong)" }}>
          Food Challenges
        </h1>
        <p className="c-body" style={{ fontSize: 14, color: "var(--ink-strong)", opacity: 0.7 }}>
          Compete, eat, and win prizes
        </p>
      </div>

      {/* Challenges list */}
      <div className="px-5 space-y-3">
        {(challenges as FoodChallenge[] | null)?.length ? (
          (challenges as FoodChallenge[]).map((challenge) => (
            <Link
              key={challenge.id}
              href={`/food/challenges/${challenge.slug}`}
              className="block press"
            >
              <ChallengeCard challenge={challenge} />
            </Link>
          ))
        ) : (
          <div
            className="text-center py-16 px-6"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <span className="block mb-3" style={{ color: "var(--ink-strong)" }}><Icon name="trophy" size={28} /></span>
            <p className="c-card-t mb-1" style={{ fontSize: 14, color: "var(--ink-strong)" }}>No active challenges</p>
            <p className="c-body" style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.7 }}>
              New food challenges are coming soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
