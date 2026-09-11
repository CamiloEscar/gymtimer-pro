import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden px-6 md:px-10 py-24 lg:py-32 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, oklch(0.7 0.19 150 / 0.12), transparent 55%), radial-gradient(circle at 15% 90%, oklch(0.82 0.16 90 / 0.06), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-2xl space-y-8">
        <h2 className="font-display-condensed font-normal uppercase tracking-[-0.01em] leading-[0.85] text-5xl md:text-7xl text-phosphor">
          Llevá tu box a la siguiente ronda
        </h2>
        <p className="text-base md:text-lg text-phosphor-dim leading-relaxed mx-auto max-w-md">
          Gratis, sin backend y sin cuentas. Arrancá a correr tu primer entrenamiento en dos
          minutos.
        </p>
        <div>
          <Link href="/app">
            <Button size="lg" className="text-lg px-8 py-5 rounded-xl">
              PROBAR AHORA →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}