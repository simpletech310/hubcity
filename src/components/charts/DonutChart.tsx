"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface DonutChartProps {
  data: { name: string; value: number; color: string }[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
}

export default function DonutChart({
  data,
  centerLabel,
  centerValue,
  size = 200,
}: DonutChartProps) {
  const outerRadius = size / 2 - 10;
  const innerRadius = outerRadius * 0.65;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerValue && (
            <span className="text-[#F5F5F0] text-2xl font-bold font-heading">
              {centerValue}
            </span>
          )}
          {centerLabel && (
            <span className="text-[rgba(245,245,240,0.65)] text-xs mt-0.5">
              {centerLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
