"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { ConnectionStatus } from "@/types";

interface DisplayConnectionProps {
  code: string;
  status: ConnectionStatus;
}

export function DisplayConnection({ code, status }: DisplayConnectionProps) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/app/workouts?code=${code}`);
  }, [code]);

  return (
    <div className="min-h-[100dvh] bg-surface-950 flex flex-col items-center justify-center gap-6 p-4 font-tactical">
      <h1 className="font-industrial text-3xl md:text-4xl uppercase tracking-tight text-phosphor">
        CONECTAR PANTALLA
      </h1>
      <p className="text-xs uppercase tracking-widest text-phosphor-muted">[ CÓDIGO ]</p>
      <p className="font-industrial text-6xl md:text-7xl uppercase tracking-widest text-brand-500">
        {code}
      </p>
      {url && (
        <div className="border-2 border-surface-700 p-2">
          <QRCodeSVG value={url} size={200} bgColor="transparent" fgColor="#EAEAEA" />
        </div>
      )}
      <p className="text-xs uppercase tracking-widest text-phosphor-muted">Escaneá para conectar</p>
      <div className="flex flex-col items-center gap-2">
        <p
          className={`text-sm uppercase tracking-widest ${
            status === "connected" ? "text-brand-500" : "text-phosphor-muted"
          }`}
        >
          {status === "connected" ? "[ CONECTADO ]" : "[ ESPERANDO AL ENTRENADOR ]"}
        </p>
        {status !== "connected" && (
          <span className="flex gap-1.5">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-phosphor-muted"
              style={{ animation: "stagger-dot 1.4s ease-in-out infinite" }}
            />
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-phosphor-muted"
              style={{ animation: "stagger-dot 1.4s ease-in-out 0.2s infinite" }}
            />
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-phosphor-muted"
              style={{ animation: "stagger-dot 1.4s ease-in-out 0.4s infinite" }}
            />
          </span>
        )}
      </div>

      <style>{`
        @keyframes stagger-dot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
