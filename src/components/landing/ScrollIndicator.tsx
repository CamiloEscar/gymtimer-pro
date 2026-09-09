export function ScrollIndicator() {
  return (
    <div
      aria-hidden
      className="hidden lg:flex absolute bottom-8 right-10 z-30 items-center gap-2 text-phosphor-muted text-xs font-tactical tracking-[0.3em] uppercase anim-fade-in-slow"
      style={{ animationDelay: "1200ms" }}
    >
      <span>Scroll</span>
      <span aria-hidden className="block w-8 h-px bg-phosphor-muted" />
      <span aria-hidden>↓</span>
    </div>
  );
}
