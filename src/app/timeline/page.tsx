import { History } from "lucide-react";
import { TimelineList } from "@/components/timeline/TimelineList";

export default function TimelinePage() {
  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
        <History className="h-7 w-7 text-primary" aria-hidden />
        Historial
      </h1>
      <p className="text-sm text-muted-foreground">
        Línea de tiempo de lo que se ha hecho
      </p>
      <TimelineList />
    </div>
  );
}
