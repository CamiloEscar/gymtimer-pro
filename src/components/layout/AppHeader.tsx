"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const SECTION_LINKS = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/workouts", label: "Rutinas" },
  { href: "/app/exercises", label: "Ejercicios" },
  { href: "/app/settings", label: "Configuración" },
  { href: "/display", label: "Pantalla" },
];

function inferBackHref(pathname: string): string | null {
  if (pathname === "/app/workouts/new") return "/app/workouts";
  const runMatch = pathname.match(/^\/app\/workouts\/([^/]+)\/run$/);
  if (runMatch) return `/app/workouts/${runMatch[1]}`;
  const editMatch = pathname.match(/^\/app\/workouts\/([^/]+)$/);
  if (editMatch) return "/app/workouts";
  const exerciseMatch = pathname.match(/^\/app\/exercises\/([^/]+)$/);
  if (exerciseMatch) return "/app/exercises";
  return null;
}

export function AppHeader() {
  const pathname = usePathname();
  const backHref = inferBackHref(pathname);
  const activeHref = SECTION_LINKS
    .map((l) => l.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <header className="sticky top-0 z-10 bg-surface-900 border-b border-surface-800 px-4 py-3">
      <nav className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 md:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {backHref && (
            <Link href={backHref}>
              <Button variant="ghost">
                <Icon name="arrow-left" />
                Atrás
              </Button>
            </Link>
          )}
          <Link href="/app" className="font-industrial text-phosphor tracking-widest text-sm md:text-base">
            GYMTIMER
          </Link>
        </div>
        <ul className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 md:gap-4 text-xs md:text-sm font-tactical">
          {SECTION_LINKS.map((link) => {
            const active = link.href === activeHref;
            const className = active ? "text-brand-500" : "text-phosphor-dim hover:text-phosphor";
            return (
              <li key={link.href}>
                <Link href={link.href} className={className}>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
