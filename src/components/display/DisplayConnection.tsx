"use client";

import { useSyncExternalStore } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { ConnectionStatus } from "@/types";
import { GymProfileRepository, type GymProfile } from "@/lib/storage/GymProfileRepository";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { Icon } from "@/components/ui/Icon";

interface DisplayConnectionProps {
  code: string;
  status: ConnectionStatus;
}

let cachedProfile: GymProfile | null = null;

function getProfileSnapshot(): GymProfile | null {
  const result = new GymProfileRepository().get();
  const value = result.ok ? result.value : null;
  if (cachedProfile?.name !== value?.name || cachedProfile?.videoUrl !== value?.videoUrl) {
    cachedProfile = value;
  }
  return cachedProfile;
}

export function DisplayConnection({ code, status }: DisplayConnectionProps) {
  const url = useSyncExternalStore(
    () => () => {},
    () => `${window.location.origin}/app/workouts?code=${code}`,
    () => "",
  );

  const profile = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      return () => window.removeEventListener("storage", onStoreChange);
    },
    getProfileSnapshot,
    () => null,
  );

  const gymName = profile?.name || null;
  const gymVideoUrl = profile?.videoUrl ?? null;

  return (
    <div className="min-h-[100dvh] bg-surface-950 flex flex-col p-4 font-tactical overflow-hidden">
      <div className="grid grid-cols-[1fr_auto] items-center gap-6 flex-1 min-h-0">
        <div className="flex flex-col items-center justify-center gap-4 max-w-2xl w-full mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          <h1
            className={`font-industrial uppercase tracking-tight text-phosphor text-center ${
              gymName ? "text-5xl md:text-7xl" : "text-3xl md:text-5xl"
            }`}
            data-testid={gymName ? "gym-name" : undefined}
          >
            {gymName ?? "CONECTAR PANTALLA"}
          </h1>
          <p className="text-xs uppercase tracking-widest text-phosphor-muted">[ CÓDIGO ]</p>
          <p className="font-industrial text-6xl md:text-7xl uppercase tracking-widest text-brand-500">
            {code}
          </p>
          {url && (
            <div className="border-2 border-surface-700 p-2 bg-surface-950/80">
              <QRCodeSVG value={url} size={200} bgColor="transparent" fgColor="#EAEAEA" />
            </div>
          )}
          <p className="text-xs uppercase tracking-widest text-phosphor-muted">
            Escaneá para conectar
          </p>
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
        </div>

        <aside
          className="flex flex-col gap-3 shrink-0"
          style={{ width: "min(420px, 32vw)" }}
          data-testid="display-side-panel"
        >
          {gymVideoUrl ? (
            <>
              <VideoPlayer
                src={gymVideoUrl}
                alt={`Video del gimnasio ${gymName ?? ""}`}
                rounded
                lazy={false}
              />
              <p
                className="text-[10px] uppercase tracking-widest text-phosphor-muted text-center truncate"
                title={gymVideoUrl}
              >
                {gymVideoUrl}
              </p>
            </>
          ) : (
            <div
              role="img"
              aria-label="Video del gimnasio no disponible"
              className="aspect-video bg-surface-900 rounded-lg flex items-center justify-center"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 85% 15%, oklch(0.7 0.19 150 / 0.12), transparent 55%), radial-gradient(circle at 80% 90%, oklch(0.82 0.16 90 / 0.07), transparent 60%)",
              }}
            >
              <Icon name="dumbbell" className="size-16 text-phosphor-muted" />
            </div>
          )}
        </aside>
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