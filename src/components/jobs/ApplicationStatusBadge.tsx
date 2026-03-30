import Badge from "@/components/ui/Badge";
import type { JobApplicationStatus } from "@/types/database";

const statusLabels: Record<JobApplicationStatus, string> = {
  submitted: "Submitted",
  reviewing: "Reviewing",
  interview: "Interview",
  offered: "Offered",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const statusVariant: Record<
  JobApplicationStatus,
  "cyan" | "gold" | "emerald" | "coral" | "purple"
> = {
  submitted: "cyan",
  reviewing: "gold",
  interview: "emerald",
  offered: "emerald",
  rejected: "coral",
  withdrawn: "purple",
};

interface ApplicationStatusBadgeProps {
  status: JobApplicationStatus;
}

export default function ApplicationStatusBadge({
  status,
}: ApplicationStatusBadgeProps) {
  return (
    <Badge
      label={statusLabels[status] ?? status}
      variant={statusVariant[status] ?? "gold"}
    />
  );
}
