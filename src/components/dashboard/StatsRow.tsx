import type { HistoryStats } from "@/lib/history/computeHistoryStats";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

interface StatsRowProps {
  stats: HistoryStats;
  totalRoutines: number;
}

function formatDurationShort(ms: number): string {
  const totalMinutes = Math.round(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function StatsRow({ stats, totalRoutines }: StatsRowProps) {
  const hasHistory = stats.sessionsThisWeek > 0 || stats.streakDays > 0 || stats.totalTimeMs > 0;

  if (!hasHistory) {
    return (
      <Card className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
          <Icon name="flame" />
        </span>
        <div className="space-y-0.5">
          <p className="text-phosphor font-semibold">Arrancá tu racha hoy</p>
          <p className="text-xs text-phosphor-dim">
            Todavía no completaste ningún entrenamiento. Iniciá uno y volvé acá.
          </p>
        </div>
      </Card>
    );
  }

  const items = [
    { label: "Esta semana", value: String(stats.sessionsThisWeek) },
    { label: "Racha", value: `${stats.streakDays}d` },
    { label: "Tiempo total", value: formatDurationShort(stats.totalTimeMs) },
    { label: "Rutinas", value: String(totalRoutines) },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item) => (
        <Card key={item.label} className="text-center space-y-1 py-5">
          <p className="font-industrial text-3xl leading-none text-phosphor tabular-nums">
            {item.value}
          </p>
          <p className="font-tactical text-[10px] text-phosphor-dim uppercase tracking-widest">
            {item.label}
          </p>
        </Card>
      ))}
    </div>
  );
}
