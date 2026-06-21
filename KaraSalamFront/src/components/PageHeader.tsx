"use client";

import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
}

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-lg font-semibold text-dark">{title}</h2>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
