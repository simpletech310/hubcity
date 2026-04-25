import Link from "next/link";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import type { Department } from "@/types/database";

const categoryIcons: Record<string, IconName> = {
  administration: "landmark",
  public_safety: "shield",
  public_works: "wrench",
  community: "handshake",
  finance: "dollar",
  planning: "chart",
  parks: "tree",
  utilities: "lightbulb",
};

export default function DepartmentCard({ department }: { department: Department }) {
  const iconName = categoryIcons[department.category] ?? "landmark";

  return (
    <Link href={`/city-hall/departments/${department.slug}`}>
      <Card variant="glass" hover>
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 flex items-center justify-center shrink-0" style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}>
            <Icon name={iconName} size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-[13px] mb-0.5 line-clamp-1" style={{ color: "var(--ink-strong)" }}>
              {department.name}
            </h3>
            {department.head_name && (
              <p className="text-[11px] c-meta font-medium truncate">
                {department.head_name}
                {department.head_title ? ` — ${department.head_title}` : ""}
              </p>
            )}
            {department.phone && (
              <p className="text-[10px] c-meta mt-1">
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
