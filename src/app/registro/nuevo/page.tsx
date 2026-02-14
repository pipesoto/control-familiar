import { NuevoRegistroForm } from "@/components/registro/NuevoRegistroForm";

export default function NuevoRegistroPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Nuevo registro</h1>
      <p className="text-sm text-muted-foreground">
        Agrega un evento médico (lo que ya pasó) o una cita (lo que viene).
      </p>
      <NuevoRegistroForm />
    </div>
  );
}
