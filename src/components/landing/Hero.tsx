"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { ScrollIndicator } from "./ScrollIndicator";

const HEADLINE = ["CONTROLÁ.", "EL TIEMPO.", "ENTRENÁ."];
const SUBTITLE =
  "El timer para tu box o gym. Controlá desde el celular, mostralo en cualquier TV.";

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] bg-surface-950 text-phosphor overflow-hidden flex flex-col lg:grid lg:grid-cols-2">
      {/* Mobile: video is a full-bleed backdrop behind the text. Desktop:
          it slots into the right column of the grid below. */}
      <div
        className="absolute inset-0 z-0 lg:hidden pointer-events-none"
        aria-hidden
      >
        <VideoPlayer
          src="/videos/ketbell.mp4"
          alt="Demo del timer"
          className="h-full opacity-40"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, var(--color-surface-950) 0%, transparent 35%, transparent 65%, var(--color-surface-950) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center gap-10 sm:gap-8 sm:items-start sm:text-left sm:justify-start flex-1 px-6 md:px-10 lg:px-16 sm:pt-28 lg:pt-28 sm:pb-16">
        <div className="flex flex-col gap-10 sm:gap-8 max-w-[600px]">
          <h1
            className="flex flex-col gap-1 text-phosphor font-display-condensed font-normal uppercase tracking-[-0.01em] leading-[0.85] text-[clamp(3.25rem,16vw,4.5rem)] md:text-[clamp(3.5rem,8vw,6rem)] lg:text-[clamp(4rem,10vw,9rem)]"
          >
            {HEADLINE.map((line, i) => (
              <span
                key={line}
                className="anim-fade-up block"
                style={{ animationDelay: `${200 + i * 150}ms` }}
              >
                {line}
              </span>
            ))}
          </h1>

          <p
            className="font-sans text-base md:text-lg text-phosphor-dim max-w-md leading-relaxed anim-fade-up-subtle mx-auto sm:mx-0"
            style={{ animationDelay: "800ms" }}
          >
            {SUBTITLE}
          </p>

          <div
            className="anim-fade-up-subtle"
            style={{ animationDelay: "1000ms" }}
          >
            <Link href="/app" className="inline-block group">
              <Button
                variant="primary"
                className="text-lg px-8 py-5 rounded-xl transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500 focus-visible:ring-offset-surface-950"
              >
                <span>PROBAR AHORA</span>
                <span
                  aria-hidden
                  className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1"
                >
                  →
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div
        className="relative bg-surface-900 lg:border-l lg:border-surface-800/50 aspect-[4/5] max-h-[50vh] lg:aspect-auto lg:max-h-none lg:h-full anim-fade-in-slow overflow-hidden hidden lg:block"
        style={{ animationDelay: "400ms" }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 85% 15%, oklch(0.7 0.19 150 / 0.12), transparent 55%), radial-gradient(circle at 80% 90%, oklch(0.82 0.16 90 / 0.07), transparent 60%)",
          }}
        />

        <div className="absolute inset-0">
          <VideoPlayer
            src="/videos/ketbell.mp4"
            alt="Demo del timer"
            className="h-full"
          />
        </div>
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, var(--color-surface-950) 0%, transparent 35%)",
          }}
        />

        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-20"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
            backgroundSize: "200px 200px",
          }}
        />
      </div>

      <ScrollIndicator />
    </section>
  );
}
