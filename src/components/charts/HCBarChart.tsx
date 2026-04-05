"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import ChartWrapper from "./ChartWrapper";

interface DataKey {
  key: string;
  color: string;
  label?: string;
}

interface HCBarChartProps {
  data: { name: string; value: number; [key: string]: any }[];
  dataKeys: DataKey[];
  layout?: "vertical" | "horizontal";
  height?: number;
  showGrid?: boolean;
  title?: string;
  subtitle?: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#111116] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[rgba(245,245,240,0.65)] text-xs mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function HCBarChart({
  data,
  dataKeys,
  layout = "horizontal",
  height = 300,
  showGrid = true,
  title,
  subtitle,
}: HCBarChartProps) {
  const isVertical = layout === "vertical";

  return (
    <ChartWrapper title={title} subtitle={subtitle} height={height}>
      <BarChart data={data} layout={isVertical ? "vertical" : "horizontal"}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            vertical={!isVertical}
            horizontal={isVertical}
          />
        )}

        {isVertical ? (
          <>
            <XAxis
              type="number"
              stroke="rgba(245,245,240,0.65)"
              tick={{ fill: "rgba(245,245,240,0.65)", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="rgba(245,245,240,0.65)"
              tick={{ fill: "rgba(245,245,240,0.65)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey="name"
              stroke="rgba(245,245,240,0.65)"
              tick={{ fill: "rgba(245,245,240,0.65)", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickLine={false}
            />
            <YAxis
              stroke="rgba(245,245,240,0.65)"
              tick={{ fill: "rgba(245,245,240,0.65)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
          </>
        )}

        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />

        {dataKeys.map((dk) => (
          <Bar
            key={dk.key}
            dataKey={dk.key}
            name={dk.label || dk.key}
            fill={dk.color}
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        ))}
      </BarChart>
    </ChartWrapper>
  );
}
