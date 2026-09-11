"use client";

import { useEffect, useState } from "react";
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
  // Live snapshot of the gym profile so a linkCode configured in /app/settings
  // is picked up immediately and routes this TV straight to /display/{code}.
  const gymProfile = useGymProfile();
  const configuredLinkCode = gymProfile?.linkCode ?? null;

  useEffect(() => {
    if (!configuredLinkCode) return;
    router.replace(`/display/${configuredLinkCode}`);
  }, [configuredLinkCode, router]);

  if (configuredLinkCode) {
    return (
      <div className="min-h-[100dvh] bg-surface-950 flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-phosphor-dim uppercase tracking-widest text-xs">
          Conectando a {configuredLinkCode}…
        </p>
      </div>
    );
  }

  if (mode === "choice") {
    return (
      <div className="min-h-[100dvh] bg-surface-950 flex flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-2xl font-bold text-phosphor">Abrir una pantalla</h1>
        <Button size="lg" onClick={() => router.push(`/display/${generateCode()}`)}>
          Generar código nuevo
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
    </div>
  );
}
