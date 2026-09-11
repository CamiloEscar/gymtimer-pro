import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-brand-500 hover:bg-brand-600 text-black",
  secondary: "bg-surface-800 hover:bg-surface-900 text-phosphor",
  danger: "bg-danger-500 hover:opacity-90 text-phosphor",
  ghost: "bg-transparent hover:bg-surface-800 text-phosphor",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-3 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-4 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors cursor-pointer active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    />
  );
}