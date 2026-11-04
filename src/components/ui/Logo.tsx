interface LogoMarkProps {
  className?: string;
}

// Brand mark: industrial stopwatch on a tactical plate. Standalone source of
// truth is src/app/icon.svg — keep both in sync (scripts/generate-icons.mjs
// rasterizes the app icon from the same geometry).
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect width="64" height="64" rx="14" fill="#090909" />
      <rect x="27.5" y="9.5" width="9" height="13" rx="2.5" fill="#0fbd59" />
      <circle cx="32" cy="39.5" r="17.5" fill="#0fbd59" />
      <path
        d="M32 39.5 L39.25 32.25"
        stroke="#090909"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <circle cx="32" cy="39.5" r="3" fill="#090909" />
    </svg>
  );
}
