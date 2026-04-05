"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface GaugeChartProps {
  value: number; // 0-100
  label?: string;
  color?: string;
  size?: number;
}

export default function GaugeChart({
  value,
  label,
  color = "#F2A900",
  size = 200,
}: GaugeChartProps) {
  const clamped = Math.max(0, Math.min(100, value));

  const gaugeData = [
    { value: clamped, fill: color },
    { value: 100 - clamped, fill: "#1C1C22" },
  ];

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
      <ResponsiveContainer width="100%" height={size}>
        <PieChart>
          <Pie
            data={gaugeData}
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={size / 2 - 30}
            outerRadius={size / 2 - 10}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            {gaugeData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div
        className="absolute flex flex-col items-center pointer-events-none"
        style={{
          left: "50%",
          bottom: 20,
          transform: "translateX(-50%)",
        }}
      >
        <span
          className="text-2xl font-bold font-heading"
          style={{ color }}
        >
          {clamped}%
        </span>
        {label && (
          <span className="text-[rgba(245,245,240,0.65)] text-xs mt-0.5">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
