"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      });
      let data: { error?: string; session?: { access_token: string; refresh_token: string } } = {};
      try {
        data = await res.json();
      } catch {
        setLoading(false);
        setError(`Error ${res.status}: la respuesta no es válida. ¿Está el servidor corriendo?`);
        return;
      }
      setLoading(false);
      if (!res.ok) {
        const errorMsg = data.error ?? `Error ${res.status}`;
        setError(errorMsg);
        return;
      }
      // Si el servidor devolvió sesión, guardarla en el cliente
      if (data.session) {
        const supabase = createClient();
        if (supabase) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        }
      }
      setSuccess(true);
      router.refresh();
    } catch (e) {
      setLoading(false);
      const msg = e instanceof Error ? e.message : "Error desconocido";
      if (msg === "Failed to fetch") {
        setError("No se pudo conectar. ¿Tienes el servidor corriendo? (npm run dev)");
      } else {
        setError(msg);
      }
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-sm space-y-6 pt-8">
        <h1 className="text-2xl font-semibold text-foreground">Revisa tu correo</h1>
        <p className="text-muted-foreground">
          Te enviamos un enlace para confirmar tu cuenta. Si no lo ves, revisa la carpeta de spam.
        </p>
        <Link href="/login" className="block">
          <Button className="w-full">Ir a iniciar sesión</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-8">
      <h1 className="text-2xl font-semibold text-foreground">Crear cuenta</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
            Nombre
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Contraseña (mín. 6 caracteres)
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creando…" : "Registrarse"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
