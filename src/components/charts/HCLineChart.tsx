"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import ChartWrapper from "./ChartWrapper";

interface DataKey {
  key: string;
  color: string;
  label?: string;
}

interface HCLineChartProps {
  data: { name: string; value: number; [key: string]: any }[];
  dataKeys: DataKey[];
  xAxisKey?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
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

export default function HCLineChart({
  data,
  dataKeys,
  xAxisKey = "name",
  height = 300,
  showGrid = true,
  showTooltip = true,
  title,
  subtitle,
}: HCLineChartProps) {
  return (
    <ChartWrapper title={title} subtitle={subtitle} height={height}>
      <AreaChart data={data}>
        <defs>
          {dataKeys.map((dk) => (
            <linearGradient
              key={dk.key}
              id={`gradient-${dk.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={dk.color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={dk.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />
        )}

        <XAxis
          dataKey={xAxisKey}
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

        {showTooltip && <Tooltip content={<CustomTooltip />} />}

        {dataKeys.map((dk) => (
          <Area
            key={dk.key}
            type="monotone"
            dataKey={dk.key}
            name={dk.label || dk.key}
            stroke={dk.color}
            strokeWidth={2}
            fill={`url(#gradient-${dk.key})`}
            dot={false}
            activeDot={{ r: 4, fill: dk.color, stroke: "#111116", strokeWidth: 2 }}
          />
        ))}
      </AreaChart>
    </ChartWrapper>
  );
}
