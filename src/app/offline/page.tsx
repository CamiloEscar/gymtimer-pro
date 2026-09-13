import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export default function OfflinePage() {
  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center gap-4">
      <Icon name="display" className="size-12 text-phosphor-muted" />
      <h1 className="font-industrial text-3xl md:text-4xl uppercase tracking-tight text-phosphor">
        Sin conexión
      </h1>
      <p className="text-sm text-phosphor-dim max-w-md leading-relaxed">
        GymTimer necesita internet para correr entrenamientos en vivo y sincronizar
        con la pantalla. Reconectá y volvé a intentar.
      </p>
      <Link href="/">
        <Button variant="ghost">
          <Icon name="arrow-left" />
          Volver al inicio
        </Button>
      </Link>
    </main>
  );
}
