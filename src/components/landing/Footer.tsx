import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-surface-800 px-6 md:px-10 py-10">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <span className="font-industrial text-xl text-phosphor uppercase tracking-tight">
          GYMTIMER
        </span>
        <nav className="flex items-center gap-6">
          <Link
            href="/app/workouts"
            className="font-tactical text-xs uppercase tracking-widest text-phosphor-dim hover:text-phosphor transition-colors"
          >
            Entrenamientos
          </Link>
          <Link
            href="/app"
            className="font-tactical text-xs uppercase tracking-widest text-phosphor-dim hover:text-phosphor transition-colors"
          >
            App
          </Link>
        </nav>
        <p className="font-tactical text-[10px] uppercase tracking-widest text-phosphor-muted">
          Hecho para boxes con estándar
        </p>
      </div>
    </footer>
  );
}