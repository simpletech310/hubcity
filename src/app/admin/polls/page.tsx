import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import AdminPollActions from "./AdminPollActions";

interface PollOption {
  id: string;
  label: string;
  emoji: string | null;
  vote_count: number;
  sort_order: number;
}

interface Poll {
  id: string;
  question: string;
  poll_type: string;
  status: string;
  total_votes: number;
  is_published: boolean;
  is_anonymous: boolean;
  ends_at: string | null;
  created_at: string;
  author: { display_name: string; role: string } | null;
  options: PollOption[];
}

export default async function AdminPollsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("polls")
    .select("*, author:profiles!polls_author_id_fkey(display_name, role), options:poll_options(*)")
    .order("created_at", { ascending: false });

  const polls = (data as Poll[] | null) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold mb-1">Polls</h1>
          <p className="text-sm text-txt-secondary">
            {polls.length} total polls
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {polls.map((poll) => {
          const maxVotes = Math.max(
            ...poll.options.map((o) => o.vote_count),
            1
          );

          return (
            <Card key={poll.id}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold">{poll.question}</h3>
                    <Badge
                      label={poll.poll_type === "temperature_check" ? "Temp Check" : "Multiple Choice"}
                      variant="purple"
                    />
                    <Badge
                      label={poll.status === "active" ? "Active" : "Closed"}
                      variant={poll.status === "active" ? "emerald" : "coral"}
                    />
                    <Badge
                      label={poll.is_published ? "Published" : "Hidden"}
                      variant={poll.is_published ? "emerald" : "gold"}
                    />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-txt-secondary">
                    <span>
                      By {poll.author?.display_name || "Unknown"}
                    </span>
                    <span>
                      {poll.total_votes} vote{poll.total_votes !== 1 ? "s" : ""}
                    </span>
                    <span>
                      {new Date(poll.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {poll.ends_at && (
                      <span>
                        Ends{" "}
                        {new Date(poll.ends_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
                <AdminPollActions poll={poll} />
              </div>

              {/* Vote distribution bar chart */}
              <div className="space-y-1.5">
                {poll.options
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((option) => {
                    const pct =
                      poll.total_votes > 0
                        ? Math.round((option.vote_count / poll.total_votes) * 100)
                        : 0;
                    const barWidth =
                      maxVotes > 0
                        ? Math.round((option.vote_count / maxVotes) * 100)
                        : 0;
                    return (
                      <div key={option.id} className="flex items-center gap-2">
                        <span className="text-xs text-txt-secondary w-32 truncate shrink-0">
                          {option.emoji && `${option.emoji} `}
                          {option.label}
                        </span>
                        <div className="flex-1 h-5 bg-white/5 rounded-md overflow-hidden relative">
                          <div
                            className="h-full bg-gold/30 rounded-md transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                          <span className="absolute inset-0 flex items-center px-2 text-[10px] font-medium text-txt-secondary">
                            {option.vote_count} ({pct}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>
          );
        })}

        {polls.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-sm text-txt-secondary">No polls yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
