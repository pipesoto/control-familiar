import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <header className="pt-2">
        <h1 className="text-2xl font-semibold text-foreground">
          SaludFamiliar
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tus controles médicos en un solo lugar
        </p>
      </header>

      <DashboardContent />
    </div>
  );
}
