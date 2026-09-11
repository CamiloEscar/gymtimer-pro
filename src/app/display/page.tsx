"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateCode } from "@/lib/session/generateCode";
import { useGymProfile } from "@/hooks/useGymProfile";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Mode = "choice" | "manual";

export default function DisplayEntryPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choice");
  const [code, setCode] = useState("");
  // Live snapshot of the gym profile. When a linkCode is configured we
  // surface it on the primary CTA so the gym TV pairs in one click; if not,
  // the same button generates a fresh random code.
  const gymProfile = useGymProfile();
  const configuredLinkCode = gymProfile?.linkCode ?? null;

  if (mode === "choice") {
    // Single CTA path: a configured linkCode replaces the random generator
    // so the gym's TV never lands on a code that no trainer is using.
    const pairedCode = configuredLinkCode ?? generateCode();
    return (
      <div className="min-h-[100dvh] bg-surface-950 flex flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-2xl font-bold text-phosphor">Abrir una pantalla</h1>
        {configuredLinkCode && (
          <>
            <p className="text-xs uppercase tracking-widest text-phosphor-dim">
              Código fijo del gimnasio
            </p>
            <p className="font-industrial text-4xl uppercase tracking-widest text-brand-500">
              {configuredLinkCode}
            </p>
          </>
        )}
        <Button size="lg" onClick={() => router.push(`/display/${pairedCode}`)}>
          {configuredLinkCode ? `Conectar a ${configuredLinkCode}` : "Generar código nuevo"}
        </Button>
        <Button size="lg" variant="secondary" onClick={() => setMode("manual")}>
          Ya tengo un código
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-surface-950 flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold text-phosphor">Abrir una pantalla</h1>
      <Input
        aria-label="Código de conexión"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="ABC123"
        className="max-w-xs text-center text-2xl font-mono"
      />
      <Button size="lg" onClick={() => router.push(`/display/${code}`)} disabled={code.length !== 6}>
        Conectar
      </Button>
      <Button size="md" variant="ghost" onClick={() => setMode("choice")}>
        Volver
      </Button>
    </div>
  );
}
