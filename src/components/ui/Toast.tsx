"use client";

import { useEffect, useState, useCallback } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

let addToastFn: ((message: string, type: Toast["type"]) => void) | null = null;

export function showToast(message: string, type: Toast["type"] = "info") {
  addToastFn?.(message, type);
}

export default function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast["type"]) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  const typeStyles = {
    success: "bg-emerald/20 border-emerald/30 text-emerald",
    error: "bg-coral/20 border-coral/30 text-coral",
    info: "bg-cyan/20 border-cyan/30 text-cyan",
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 max-w-[400px] w-full px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            px-4 py-3 rounded-xl border text-sm font-medium
            animate-in slide-in-from-top
            ${typeStyles[toast.type]}
          `}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
