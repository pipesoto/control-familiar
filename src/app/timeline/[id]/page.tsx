"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Calendar, FileText, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { MedicalRecord } from "@/types/database";

type RecordWithMember = MedicalRecord & {
  family_members?: { name: string; relationship: string } | null;
};

export default function EventoDetallePage() {
  const params = useParams();
  const id = params.id as string;
  const [record, setRecord] = useState<RecordWithMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchRecord() {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const supabase = createClient();
      if (!supabase) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("medical_records")
        .select(`
          *,
          family_members (name, relationship)
        `)
        .eq("id", id)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setRecord(data as RecordWithMember);
      }
      setLoading(false);
    }
    fetchRecord();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (notFound || !record) {
    return (
      <div className="space-y-6">
        <Link href="/timeline" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Volver al historial
        </Link>
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="font-medium text-foreground">Evento no encontrado</p>
          <Link href="/timeline" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Ver historial
          </Link>
        </div>
      </div>
    );
  }

  const member = record.family_members as { name: string; relationship: string } | undefined;
  const date = new Date(record.event_date + "T12:00:00");
  const hasPhoto = !!record.photo_url;

  return (
    <div className="space-y-6">
      <Link href="/timeline" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Volver al historial
      </Link>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Foto principal si existe */}
        {hasPhoto && (
          <div className="relative w-full bg-muted">
            <a
              href={record.photo_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
              aria-label="Abrir imagen en nueva pestaña"
            >
              <img
                src={record.photo_url!}
                alt={`Foto: ${record.title}`}
                className="w-full max-h-[320px] object-contain object-center"
              />
            </a>
            <p className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
              Toca para ampliar
            </p>
          </div>
        )}

        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              {hasPhoto ? <ImageIcon className="h-6 w-6" aria-hidden /> : <FileText className="h-6 w-6" aria-hidden />}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{record.title}</h1>
              <p className="text-sm text-muted-foreground">
                {member?.name ?? "Familiar"} · {member?.relationship}
              </p>
            </div>
          </div>

          <dl className="mt-6 space-y-4 border-t border-border pt-4">
            <div className="flex gap-3">
              <Calendar className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Fecha del evento</dt>
                <dd className="text-foreground">{format(date, "EEEE d 'de' MMMM, yyyy", { locale: es })}</dd>
              </div>
            </div>
            {record.category && (
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Categoría</dt>
                <dd>
                  <span className="inline-block rounded-full bg-accent px-2 py-0.5 text-sm text-accent-foreground">
                    {record.category}
                  </span>
                </dd>
              </div>
            )}
            {record.description && (
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Descripción</dt>
                <dd className="mt-1 text-foreground whitespace-pre-wrap">{record.description}</dd>
              </div>
            )}
          </dl>

          {hasPhoto && (
            <div className="mt-6 pt-4 border-t border-border">
              <a
                href={record.photo_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-primary/15 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/25"
              >
                <ImageIcon className="h-5 w-5" aria-hidden />
                Abrir imagen en nueva pestaña
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
