"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { FamilyMember } from "@/types/database";

export function PerfilContent() {
  const [session, setSession] = useState<{ email?: string; fullName?: string } | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data: { session: s } } = await supabase.auth.getSession();
      if (s?.user) {
        setSession({
          email: s.user.email ?? undefined,
          fullName: (s.user.user_metadata?.full_name as string) ?? undefined,
        });
        const { data } = await supabase.from("family_members").select("*").eq("user_id", s.user.id);
        setFamilyMembers(data || []);
      } else {
        setSession(null);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase?.auth.getUser() ?? { data: { user: null } };
    if (!supabase || !user || !name.trim() || !relationship.trim()) {
      setError("Completa nombre y parentesco.");
      return;
    }
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase.from("family_members") as any).insert({
      user_id: user.id,
      name: name.trim(),
      relationship: relationship.trim(),
      birth_date: birthDate || null,
    });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setName("");
    setRelationship("");
    setBirthDate("");
    setShowForm(false);
    const { data } = await supabase.from("family_members").select("*").eq("user_id", user.id);
    setFamilyMembers(data || []);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-xl bg-muted" />
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <User className="mx-auto h-12 w-12 text-muted-foreground/60" aria-hidden />
        <p className="mt-3 font-medium text-foreground">Inicia sesión para ver tu perfil</p>
        <p className="mt-1 text-sm text-muted-foreground">Así podrás agregar familiares y guardar registros.</p>
        <div className="mt-4 flex gap-3 justify-center">
          <Link href="/login"><Button>Iniciar sesión</Button></Link>
          <Link href="/signup"><Button variant="outline">Registrarse</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium text-muted-foreground">Tu cuenta</p>
        <p className="font-medium text-foreground">{session.fullName || "Usuario"}</p>
        <p className="text-sm text-muted-foreground">{session.email}</p>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground">Familiares</h2>
          {!showForm && (
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Agregar
            </Button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleAddMember} className="mt-4 rounded-xl border border-border bg-card p-4 space-y-3">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground">Nombre</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ej. María, Sofía"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              />
            </div>
            <div>
              <label htmlFor="relationship" className="block text-sm font-medium text-foreground">Parentesco</label>
              <select
                id="relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              >
                <option value="">Selecciona</option>
                <option value="Yo / madre">Yo / madre</option>
                <option value="Hijo">Hijo</option>
                <option value="Hija">Hija</option>
                <option value="Pareja">Pareja</option>
                <option value="Otro dependiente">Otro dependiente</option>
              </select>
            </div>
            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-foreground">Fecha de nacimiento (opcional)</label>
              <input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </form>
        )}

        {familyMembers.length === 0 && !showForm && (
          <p className="mt-3 text-sm text-muted-foreground">Aún no has agregado familiares. Toca &quot;Agregar&quot; para empezar.</p>
        )}
        <ul className="mt-3 space-y-2">
          {familyMembers.map((fm) => (
            <li key={fm.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <User className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="font-medium text-foreground">{fm.name}</p>
                <p className="text-sm text-muted-foreground">{fm.relationship}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
