"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { MobileMenu } from "./MobileMenu";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 z-40 h-16 md:h-20 px-6 md:px-10 flex items-center justify-between anim-fade-down">
        <Link
          href="/"
          className="font-industrial text-xl md:text-2xl text-phosphor uppercase tracking-tight hover:text-brand-500 transition-colors"
        >
          GYMTIMER
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            href="#modos"
            className="text-sm font-medium text-phosphor-dim hover:text-phosphor transition-colors"
          >
            Modos
          </Link>
          <Link
            href="#como-funciona"
            className="text-sm font-medium text-phosphor-dim hover:text-phosphor transition-colors"
          >
            Cómo funciona
          </Link>
          <Link
            href="/app/workouts"
            className="text-sm font-medium text-phosphor-dim hover:text-phosphor transition-colors"
          >
            Entrenamientos
          </Link>
          <Link href="/app">
            <Button size="md" variant="secondary">
              PROBAR AHORA
            </Button>
          </Link>
        </div>

        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(true)}
          className="md:hidden inline-flex items-center justify-center w-11 h-11 -mr-2 text-phosphor hover:text-brand-500 transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden
            className="size-6"
          >
            <line x1="4" y1="8" x2="20" y2="8" />
            <line x1="4" y1="16" x2="20" y2="16" />
          </svg>
        </button>
      </nav>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
