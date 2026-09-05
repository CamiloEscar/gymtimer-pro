import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl bg-surface-900 border border-surface-800 p-4 ${className}`}
      {...props}
    />
  );
}
