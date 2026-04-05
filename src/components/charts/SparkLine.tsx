"use client";

import { LineChart, Line } from "recharts";

interface SparkLineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export default function SparkLine({
  data,
  color = "#F2A900",
  height = 40,
  width = 120,
}: SparkLineProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <LineChart width={width} height={height} data={chartData}>
      <Line
        type="monotone"
        dataKey="value"
        stroke={color}
        strokeWidth={2}
        dot={false}
        isAnimationActive={false}
      />
    </LineChart>
  );
}
