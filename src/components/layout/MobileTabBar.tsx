"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/app", label: "Inicio", icon: "dumbbell" },
  { href: "/app/workouts", label: "Rutinas", icon: "repeat" },
  { href: "/app/exercises", label: "Ejercicios", icon: "clock" },
  { href: "/app/settings", label: "Ajustes", icon: "menu" },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface-900/95 border-t border-surface-800 backdrop-blur md:hidden"
    >
      <ul className="flex items-stretch justify-around">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-tactical uppercase tracking-wider ${
                  active ? "text-brand-500" : "text-phosphor-dim hover:text-phosphor"
                }`}
              >
                <Icon name={tab.icon} className="size-5" />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}