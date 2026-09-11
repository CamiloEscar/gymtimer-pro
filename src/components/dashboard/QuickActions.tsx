import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/app/workouts/new">
        <Button size="md">+ Nueva rutina</Button>
      </Link>
      <Link href="/app/settings">
        <Button size="md" variant="ghost">
          <Icon name="pencil" />
          Configuración
        </Button>
      </Link>
      <Link href="/display">
        <Button size="md" variant="secondary">
          <Icon name="display" />
          Abrir Display
        </Button>
      </Link>
    </div>
  );
}
