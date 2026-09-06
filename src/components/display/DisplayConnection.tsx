"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { ConnectionStatus } from "@/types";

interface DisplayConnectionProps {
  code: string;
  status: ConnectionStatus;
}

export function DisplayConnection({ code, status }: DisplayConnectionProps) {
  // Computed only after mount (not during the initial render) so the
  // server-rendered HTML and the first client render both omit the QR code —
  // reading window.location during render diverges between SSR and hydration
  // and causes a React hydration mismatch.
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/display/${code}`);
  }, [code]);

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-8 p-4">
      <h1 className="text-4xl font-black text-white">CONECTAR PANTALLA</h1>
      <p className="text-gray-400">Código:</p>
      <p className="text-6xl font-mono font-bold text-brand-500 tracking-widest">{code}</p>
      {url && <QRCodeSVG value={url} size={200} bgColor="transparent" fgColor="#ffffff" />}
      <p className="text-gray-400">Escaneá para conectar</p>
      <p className={status === "connected" ? "text-brand-500" : "text-gray-500"}>
        {status === "connected" ? "CONECTADO ✓" : "Esperando al entrenador…"}
      </p>
    </div>
  );
}
