"use client";

import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--ink-mute)" }}>
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-mute)" }}>
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full border rounded-xl
              px-4 py-3 text-sm
              focus:outline-none focus:ring-1 focus:ring-gold/20
              transition-colors
              ${icon ? "pl-10" : ""}
              ${error ? "border-coral/50" : ""}
              ${className}
            `}
            style={{
              background: "var(--paper)",
              color: "var(--ink-strong)",
              border: "2px solid var(--rule-strong-c)",
            }}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-coral">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
