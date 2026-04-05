"use client";

import { useState, useMemo } from "react";

interface ActivityHeatmapProps {
  data: { date: string; count: number }[];
  colorScale?: string[];
  weeks?: number;
}

const DEFAULT_COLORS = ["#0A0A0A", "#5C4400", "#A37600", "#F2A900", "#FFCF4A"];

const CELL_SIZE = 14;
const CELL_GAP = 3;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function getColorForCount(
  count: number,
  max: number,
  colorScale: string[]
): string {
  if (count === 0) return colorScale[0];
  const ratio = count / max;
  const index = Math.min(
    Math.floor(ratio * (colorScale.length - 1)) + 1,
    colorScale.length - 1
  );
  return colorScale[index];
}

export default function ActivityHeatmap({
  data,
  colorScale = DEFAULT_COLORS,
  weeks = 20,
}: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    date: string;
    count: number;
  } | null>(null);

  const { grid, maxCount } = useMemo(() => {
    const lookup = new Map(data.map((d) => [d.date, d.count]));
    const max = data.reduce((m, d) => Math.max(m, d.count), 1);

    const today = new Date();
    const dayOfWeek = today.getDay();
    // Start from (weeks) weeks ago, on Sunday
    const start = new Date(today);
    start.setDate(start.getDate() - dayOfWeek - (weeks - 1) * 7);

    const columns: { date: string; count: number }[][] = [];
    const current = new Date(start);

    for (let w = 0; w < weeks; w++) {
      const week: { date: string; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = current.toISOString().split("T")[0];
        week.push({ date: dateStr, count: lookup.get(dateStr) || 0 });
        current.setDate(current.getDate() + 1);
      }
      columns.push(week);
    }

    return { grid: columns, maxCount: max };
  }, [data, weeks]);

  const labelWidth = 30;
  const svgWidth = labelWidth + weeks * (CELL_SIZE + CELL_GAP);
  const svgHeight = 7 * (CELL_SIZE + CELL_GAP);

  return (
    <div className="relative inline-block">
      <svg
        width={svgWidth}
        height={svgHeight}
        className="block"
      >
        {/* Day labels */}
        {DAY_LABELS.map((label, i) =>
          label ? (
            <text
              key={i}
              x={labelWidth - 6}
              y={i * (CELL_SIZE + CELL_GAP) + CELL_SIZE - 2}
              fill="rgba(245,245,240,0.65)"
              fontSize={10}
              textAnchor="end"
            >
              {label}
            </text>
          ) : null
        )}

        {/* Grid cells */}
        {grid.map((week, wi) =>
          week.map((day, di) => (
            <rect
              key={`${wi}-${di}`}
              x={labelWidth + wi * (CELL_SIZE + CELL_GAP)}
              y={di * (CELL_SIZE + CELL_GAP)}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={3}
              fill={getColorForCount(day.count, maxCount, colorScale)}
              className="cursor-pointer"
              onMouseEnter={(e) => {
                const rect = (e.target as SVGRectElement).getBoundingClientRect();
                const parent = (
                  e.target as SVGRectElement
                ).closest("div")!.getBoundingClientRect();
                setTooltip({
                  x: rect.left - parent.left + CELL_SIZE / 2,
                  y: rect.top - parent.top - 8,
                  date: day.date,
                  count: day.count,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          ))
        )}
      </svg>

      {tooltip && (
        <div
          className="absolute z-10 bg-[#111116] border border-[rgba(255,255,255,0.06)] rounded-lg px-2 py-1 shadow-lg pointer-events-none text-xs whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <span className="text-[#F5F5F0] font-medium">
            {tooltip.count} contribution{tooltip.count !== 1 ? "s" : ""}
          </span>
          <span className="text-[rgba(245,245,240,0.65)] ml-1.5">
            {tooltip.date}
          </span>
        </div>
      )}
    </div>
  );
}
