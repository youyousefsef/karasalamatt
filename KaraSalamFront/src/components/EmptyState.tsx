import type { ReactNode } from "react";

interface EmptyStateProps {
  message: string;
  action?: ReactNode;
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
      <p className="text-gray-500">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
