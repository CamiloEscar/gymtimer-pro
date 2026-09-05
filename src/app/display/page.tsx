"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function DisplayEntryPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold text-white">Abrir una pantalla</h1>
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
