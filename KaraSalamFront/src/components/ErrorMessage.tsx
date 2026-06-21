"use client";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({
  message,
  onRetry,
  className = "",
}: ErrorMessageProps) {
  return (
    <div
      className={`rounded-lg bg-red-50 p-4 text-sm text-red-600 ${className}`}
      role="alert"
    >
      <p>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-sm font-medium text-red-700 underline hover:no-underline"
        >
          تلاش مجدد
        </button>
      )}
    </div>
  );
}
