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
      <Card className="text-center">
        <p className="text-phosphor font-semibold inline-flex items-center gap-2">
          Arrancá tu racha hoy
          <Icon name="flame" />
        </p>
        <p className="text-sm text-phosphor-dim mt-1">
          Todavía no completaste ningún entrenamiento. Iniciá uno y volvé acá.
        </p>
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
        <Card key={item.label} className="text-center">
          <p className="font-tactical text-2xl text-brand-500">{item.value}</p>
          <p className="text-xs text-phosphor-dim uppercase tracking-wide mt-1">{item.label}</p>
        </Card>
      ))}
    </div>
  );
}
