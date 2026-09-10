"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function DisplayHeader() {
  return (
    <Link
      href="/app/workouts"
      aria-label="Atrás"
      className="fixed top-12 left-3 z-50 opacity-40 hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-200"
    >
      <Button variant="ghost">
        <Icon name="arrow-left" />
      </Button>
    </Link>
  );
}
