"use client";

import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  className = "",
  id,
  ...rest
}: InputProps) {
  const inputId = id || label?.replace(/\s/g, "");

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50 ${
          error ? "border-red-400" : "border-gray-300"
        } ${className}`}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
