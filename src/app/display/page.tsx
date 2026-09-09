"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateCode } from "@/lib/session/generateCode";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Mode = "choice" | "manual";

export default function DisplayEntryPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choice");
  const [code, setCode] = useState("");

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
