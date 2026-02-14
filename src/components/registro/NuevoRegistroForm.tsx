"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_CATEGORIES, OTRAS_CATEGORIA_VALUE } from "@/lib/categories";
import type { FamilyMember } from "@/types/database";

const STORAGE_BUCKET = "medical-photos";

type FormType = "evento" | "cita";

export function NuevoRegistroForm() {
  const router = useRouter();
  const [tipo, setTipo] = useState<FormType>("evento");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [session, setSession] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [photoWarning, setPhotoWarning] = useState<string | null>(null);

  // Evento médico
  const [familyMemberId, setFamilyMemberId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [categoryOption, setCategoryOption] = useState<string>("");
  const [categoryCustom, setCategoryCustom] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Cita
  const [scheduledAt, setScheduledAt] = useState("");
  const [specialtyOption, setSpecialtyOption] = useState<string>("");
  const [specialtyCustom, setSpecialtyCustom] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) {
        setSession(false);
        setLoadingMembers(false);
        return;
      }
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(!!s);
      if (s?.user) {
        const { data } = await supabase.from("family_members").select("*").eq("user_id", s.user.id);
        const list = (data ?? []) as FamilyMember[];
        setFamilyMembers(list);
        if (list.length) {
          const yo = list.find((f) => f.relationship === "Yo / madre" || f.relationship === "Yo");
          setFamilyMemberId(yo ? yo.id : list[0].id);
        }
      }
      setLoadingMembers(false);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    if (!supabase || !session) {
      setError("Inicia sesión para guardar.");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Sesión expirada. Vuelve a iniciar sesión.");
      return;
    }
    if (!familyMemberId || !familyMembers.find((f) => f.id === familyMemberId)) {
      setError("Elige un familiar. Si no tienes, agrégalo en Perfil.");
      return;
    }

    setSaving(true);
    if (tipo === "evento") {
      if (!title.trim() || !eventDate) {
        setError("Completa título y fecha.");
        setSaving(false);
        return;
      }
      let photoUrl: string | null = null;
      let photoUploadFailed = false;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from(STORAGE_BUCKET).upload(path, photoFile, { upsert: false });
        if (uploadErr) {
          photoUploadFailed = true;
          // Guardamos el registro sin foto; avisamos al final
        } else {
          const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
          photoUrl = urlData.publicUrl;
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err } = await (supabase.from("medical_records") as any).insert({
        family_member_id: familyMemberId,
        title: title.trim(),
        description: description.trim() || null,
        event_date: eventDate,
        category: (categoryOption === OTRAS_CATEGORIA_VALUE ? categoryCustom.trim() : categoryOption) || null,
        photo_url: photoUrl,
      });
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
      setSuccess(true);
      setPhotoFile(null);
      setPhotoPreview(null);
      if (photoUploadFailed) {
        setPhotoWarning("Registro guardado. La foto no pudo subirse: crea el bucket 'medical-photos' en Supabase (Storage → New bucket) para subir fotos la próxima vez.");
      }
      setTimeout(() => router.push("/timeline"), photoUploadFailed ? 4000 : 1500);
    } else {
      if (!scheduledAt) {
        setError("Indica fecha y hora de la cita.");
        setSaving(false);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err } = await (supabase.from("appointments") as any).insert({
        family_member_id: familyMemberId,
        scheduled_at: new Date(scheduledAt).toISOString(),
        specialty: (specialtyOption === OTRAS_CATEGORIA_VALUE ? specialtyCustom.trim() : specialtyOption) || null,
        notes: notes.trim() || null,
      });
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/agenda"), 1500);
    }
    setSaving(false);
  }

  const canSave = session && familyMembers.length > 0;

  if (loadingMembers) {
    return (
      <div className="space-y-4">
        <div className="h-10 animate-pulse rounded-lg bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="font-medium text-foreground">Guardado correctamente</p>
        {photoWarning && (
          <p className="mt-2 text-sm text-amber-600">{photoWarning}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">Redirigiendo…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!session && (
        <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
          Inicia sesión para guardar registros. Si no tienes cuenta,{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">regístrate</Link>
          {" "}y luego{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">entra</Link>.
        </div>
      )}

      {session && familyMembers.length === 0 && (
        <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
          Agrega al menos un familiar en{" "}
          <Link href="/perfil" className="font-medium text-primary hover:underline">Perfil</Link> para poder guardar.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground">Tipo</label>
          <div className="mt-2 flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="tipo"
                checked={tipo === "evento"}
                onChange={() => setTipo("evento")}
                className="rounded-full border-border"
              />
              <span>Evento médico</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="tipo"
                checked={tipo === "cita"}
                onChange={() => setTipo("cita")}
                className="rounded-full border-border"
              />
              <span>Cita / control</span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="familiar" className="block text-sm font-medium text-foreground">Familiar</label>
          <select
            id="familiar"
            value={familyMemberId}
            onChange={(e) => setFamilyMemberId(e.target.value)}
            required
            disabled={familyMembers.length === 0}
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground"
          >
            <option value="">Selecciona (yo, hijo/a, etc.)</option>
            {familyMembers.map((f) => (
              <option key={f.id} value={f.id}>{f.name} — {f.relationship}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            Si no ves opciones, ve a <Link href="/perfil" className="font-medium text-primary hover:underline">Perfil</Link> y agrega familiares (tú, hijos, etc.).
          </p>
        </div>

        {tipo === "evento" && (
          <>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground">Título</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Control prenatal, Vacuna gripe"
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground"
              />
            </div>
            <div>
              <label htmlFor="eventDate" className="block text-sm font-medium text-foreground">Fecha del evento</label>
              <input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-foreground">Categoría (opcional)</label>
              <select
                id="category"
                value={categoryOption}
                onChange={(e) => setCategoryOption(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground"
              >
                <option value="">Selecciona categoría</option>
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value={OTRAS_CATEGORIA_VALUE}>Otra (crear categoría)</option>
              </select>
              {categoryOption === OTRAS_CATEGORIA_VALUE && (
                <input
                  type="text"
                  value={categoryCustom}
                  onChange={(e) => setCategoryCustom(e.target.value)}
                  placeholder="Escribe la categoría"
                  className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground"
                  aria-label="Nombre de la categoría"
                />
              )}
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground">Descripción (opcional)</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Foto (opcional)</label>
              <p className="mt-0.5 text-xs text-muted-foreground">Receta, resultado de examen, etc.</p>
              {!photoPreview ? (
                <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-6 transition-colors hover:bg-muted/50">
                  <ImagePlus className="h-6 w-6 text-muted-foreground" aria-hidden />
                  <span className="text-sm text-muted-foreground">Elegir imagen</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPhotoFile(file);
                        setPhotoPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              ) : (
                <div className="mt-2 flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <img src={photoPreview} alt="Vista previa" className="h-16 w-16 rounded object-cover" />
                  <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{photoFile?.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Quitar foto"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {tipo === "cita" && (
          <>
            <div>
              <label htmlFor="scheduledAt" className="block text-sm font-medium text-foreground">Fecha y hora</label>
              <input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground"
              />
            </div>
            <div>
              <label htmlFor="specialty" className="block text-sm font-medium text-foreground">Especialidad (opcional)</label>
              <select
                id="specialty"
                value={specialtyOption}
                onChange={(e) => setSpecialtyOption(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground"
              >
                <option value="">Selecciona especialidad</option>
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value={OTRAS_CATEGORIA_VALUE}>Otra (crear especialidad)</option>
              </select>
              {specialtyOption === OTRAS_CATEGORIA_VALUE && (
                <input
                  type="text"
                  value={specialtyCustom}
                  onChange={(e) => setSpecialtyCustom(e.target.value)}
                  placeholder="Escribe la especialidad"
                  className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground"
                  aria-label="Nombre de la especialidad"
                />
              )}
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-foreground">Notas (opcional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground"
              />
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={!canSave || saving}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </div>
  );
}
