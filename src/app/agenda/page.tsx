import { Calendar } from "lucide-react";
import { AgendaList } from "@/components/agenda/AgendaList";

export default function AgendaPage() {
  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
        <Calendar className="h-7 w-7 text-primary" aria-hidden />
        Agenda
      </h1>
      <p className="text-sm text-muted-foreground">
        Próximos controles y citas programadas
      </p>
      <AgendaList />
    </div>
  );
}
