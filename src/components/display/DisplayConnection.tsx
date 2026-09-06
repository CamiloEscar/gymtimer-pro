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
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center gap-6 p-4 font-tactical">
      <h1 className="font-industrial text-3xl md:text-4xl uppercase tracking-tight text-phosphor">
        CONECTAR PANTALLA
      </h1>
      <p className="text-xs uppercase tracking-widest text-gray-500">[ CÓDIGO ]</p>
      <p className="font-industrial text-6xl md:text-7xl uppercase tracking-widest text-brand-500">
        {code}
      </p>
      {url && (
        <div className="border-2 border-surface-700 p-2">
          <QRCodeSVG value={url} size={200} bgColor="transparent" fgColor="#EAEAEA" />
        </div>
      )}
      <p className="text-xs uppercase tracking-widest text-gray-500">Escaneá para conectar</p>
      <p
        className={`text-sm uppercase tracking-widest ${
          status === "connected" ? "text-brand-500" : "text-gray-500"
        }`}
      >
        {status === "connected" ? "[ CONECTADO ]" : "[ ESPERANDO AL ENTRENADOR ]"}
      </p>
    </div>
  );
}
