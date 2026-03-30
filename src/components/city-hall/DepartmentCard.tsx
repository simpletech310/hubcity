import Link from "next/link";
import Card from "@/components/ui/Card";
import type { Department } from "@/types/database";

const categoryEmojis: Record<string, string> = {
  administration: "🏛️",
  public_safety: "🛡️",
  public_works: "🚧",
  community: "🤝",
  finance: "💰",
  planning: "📐",
  parks: "🌳",
  utilities: "💡",
};

export default function DepartmentCard({ department }: { department: Department }) {
  const emoji = categoryEmojis[department.category] ?? "🏛️";

  return (
    <Link href={`/city-hall/departments/${department.slug}`}>
      <Card hover>
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center text-lg shrink-0 border border-gold/15">
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-[13px] mb-0.5 line-clamp-1">
              {department.name}
            </h3>
            {department.head_name && (
              <p className="text-[11px] text-txt-secondary font-medium truncate">
                {department.head_name}
                {department.head_title ? ` — ${department.head_title}` : ""}
              </p>
            )}
            {department.phone && (
              <p className="text-[10px] text-txt-secondary mt-1">
                {department.phone}
              </p>
            )}
          </div>
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gold shrink-0 mt-1"
            strokeLinecap="round"
          >
            <path d="M6 4l4 4-4 4" />
          </svg>
        </div>
      </Card>
    </Link>
  );
}
