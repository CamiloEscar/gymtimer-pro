"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function DisplayHeader() {
  return (
    <header className="sticky top-0 z-10 bg-surface-900 border-b border-surface-800 px-4 py-3">
      <nav className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 md:gap-4">
        <Link href="/">
          <Button variant="ghost">
            <Icon name="arrow-left" />
            Atrás
          </Button>
        </Link>
        <Link href="/" className="font-industrial text-phosphor tracking-widest text-sm md:text-base">
          GYMTIMER · Pantalla
        </Link>
      </nav>
    </header>
  );
}
