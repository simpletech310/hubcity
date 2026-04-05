"use client";

import { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

interface ChartWrapperProps {
  title?: string;
  subtitle?: string;
  height?: number;
  children: ReactNode;
  className?: string;
}

export default function ChartWrapper({
  title,
  subtitle,
  height = 300,
  children,
  className = "",
}: ChartWrapperProps) {
  return (
    <div
      className={`bg-[#1C1C22] rounded-2xl border border-[rgba(255,255,255,0.06)] p-4 ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-3">
          {title && (
            <h3 className="font-heading text-[#F5F5F0] text-base font-semibold">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-[rgba(245,245,240,0.65)] text-sm mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}
