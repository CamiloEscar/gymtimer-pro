"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menú de navegación"
      aria-hidden={!open}
      className={`fixed inset-0 z-[100] bg-surface-950 flex flex-col transition-opacity duration-200 ${
        open
          ? "opacity-100 pointer-events-auto anim-fade-in-panel"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="h-16 px-6 flex items-center justify-between">
        <span className="font-industrial text-xl text-phosphor uppercase tracking-tight">
          GYMTIMER
        </span>
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onClose}
          className="inline-flex items-center justify-center w-11 h-11 -mr-2 text-phosphor hover:text-brand-500 transition-colors"
        >
          <Icon name="close" className="size-6" />
        </button>
      </div>

      <nav className="flex-1 flex flex-col justify-center px-8 gap-6">
        <Link
          href="#modos"
          onClick={onClose}
          className="font-industrial text-3xl text-phosphor uppercase tracking-tight hover:text-brand-500 transition-colors py-3"
        >
          Modos
        </Link>
        <Link
          href="#como-funciona"
          onClick={onClose}
          className="font-industrial text-3xl text-phosphor uppercase tracking-tight hover:text-brand-500 transition-colors py-3"
        >
          Cómo funciona
        </Link>
        <Link
          href="/app/workouts"
          onClick={onClose}
          className="font-industrial text-3xl text-phosphor uppercase tracking-tight hover:text-brand-500 transition-colors py-3"
        >
          Entrenamientos
        </Link>
        <Link href="/app" onClick={onClose} className="self-start mt-2">
          <Button size="lg" variant="primary" className="text-lg px-8 py-5">
            ENTRAR →
          </Button>
        </Link>
      </nav>
    </div>
  );
}
