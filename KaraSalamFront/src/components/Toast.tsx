"use client";

import { useState, useEffect, useCallback } from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  message: string;
  type: ToastType;
  id: number;
}

let toastId = 0;
let addToastFn: ((data: ToastItem) => void) | null = null;

export function showToast(message: string, type: ToastType = "info") {
  addToastFn?.({ message, type, id: ++toastId });
}

const typeStyles: Record<ToastType, string> = {
  success: "bg-green-600 text-white",
  error: "bg-red-500 text-white",
  info: "bg-dark text-white",
};

const typeIcons: Record<ToastType, string> = {
  success: "\u2713",
  error: "\u2717",
  info: "\u2139",
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((data: ToastItem) => {
    setToasts((prev) => [...prev, data]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== data.id));
    }, 4000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-[60] flex flex-col gap-2"
      aria-live="polite"
      aria-label="اعلان‌ها"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg transition-all ${typeStyles[toast.type]}`}
          role="status"
        >
          <span aria-hidden="true">{typeIcons[toast.type]}</span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
