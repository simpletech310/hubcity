import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { CityService } from "@/types/database";

interface ServiceCardProps {
  service: CityService;
  departmentName?: string;
}

export default function ServiceCard({ service, departmentName }: ServiceCardProps) {
  return (
    <Card hover>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 mr-3">
          <h3 className="font-heading font-bold text-[13px] mb-0.5 line-clamp-1">
            {service.name}
          </h3>
          {departmentName && (
            <p className="text-[11px] text-txt-secondary font-medium truncate">
              {departmentName}
            </p>
          )}
        </div>
        {service.is_online && (
          <Badge label="Online" variant="emerald" />
        )}
      </div>
      {service.description && (
        <p className="text-[12px] text-txt-secondary leading-relaxed mb-3 line-clamp-2">
          {service.description}
        </p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {service.fee_description && (
            <Badge label={service.fee_description} variant="gold" />
          )}
          {!service.fee_description && (
            <Badge label="Free" variant="emerald" />
          )}
        </div>
        {service.online_url && (
          <a
            href={service.online_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-gold font-semibold hover:opacity-80 transition-opacity flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            Apply Online
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M4 3l4 4-4 4" />
            </svg>
          </a>
        )}
      </div>
    </Card>
  );
}
