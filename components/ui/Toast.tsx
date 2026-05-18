"use client";

import React, { useEffect, useState } from "react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

let addToastFn:
  | ((msg: string, type: "success" | "error" | "info") => void)
  | null = null;

export function showToast(
  message: string,
  type: "success" | "error" | "info" = "info",
) {
  if (addToastFn) addToastFn(message, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastFn = (message, type) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    return () => {
      addToastFn = null;
    };
  }, []);

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  const colors: Record<string, string> = {
    success: "bg-green-600/90 border-green-400/30",
    error: "bg-red-600/90 border-red-400/30",
    info: "bg-cyan-600/90 border-cyan-400/30",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 pr-8 rounded-md border text-white text-sm shadow-lg animate-in slide-in-from-right relative ${colors[t.type]}`}
        >
          {t.message}
          <button
            onClick={() => dismiss(t.id)}
            className="absolute top-1 right-2 text-white/70 hover:text-white text-sm leading-none"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
