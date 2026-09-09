import type { SelectHTMLAttributes } from "react";

export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-lg bg-surface-800 border border-surface-800 px-3 py-2 text-phosphor focus:outline-none focus:ring-2 focus:ring-brand-500 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
