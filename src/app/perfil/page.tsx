import { User } from "lucide-react";
import { PerfilContent } from "@/components/perfil/PerfilContent";

export default function PerfilPage() {
  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
        <User className="h-7 w-7 text-primary" aria-hidden />
        Perfil
      </h1>
      <PerfilContent />
    </div>
  );
}
