"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "dark" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:opacity-90",
  secondary: "border border-gray-300 bg-white text-dark hover:bg-gray-50",
  danger: "bg-red-500 text-white hover:bg-red-600",
  dark: "bg-dark text-white hover:opacity-90",
  ghost: "text-accent hover:bg-accent/5",
};

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...rest}
    >
      {loading && (
        <svg
          className="-ms-1 me-2 h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
