"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { FileText, ImageIcon } from "lucide-react";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import type { FamilyMember, MedicalRecord } from "@/types/database";

type RecordWithMember = MedicalRecord & {
  family_members?: { name: string; relationship: string } | null;
};

export function TimelineList() {
  const [records, setRecords] = useState<RecordWithMember[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        if (!supabase) {
          setRecords([]);
          setLoading(false);
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: fmData } = await supabase.from("family_members").select("*").eq("user_id", session.user.id);
          setFamilyMembers((fmData ?? []) as FamilyMember[]);
        }
      } catch {
        // ignore
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchRecords() {
      setLoading(true);
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        if (!supabase) {
          setRecords([]);
          setLoading(false);
          return;
        }
        let query = supabase
          .from("medical_records")
          .select(`
            *,
            family_members (name, relationship)
          `)
          .order("event_date", { ascending: false });
        if (selectedFamilyId) {
          query = query.eq("family_member_id", selectedFamilyId);
        }
        const { data, error } = await query;
        if (error) throw error;
        setRecords((data ?? []) as RecordWithMember[]);
      } catch {
        setRecords([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRecords();
  }, [selectedFamilyId]);

  const defaultSet = new Set<string>(DEFAULT_CATEGORIES);
  const customFromRecords = records
    .map((r) => r.category)
    .filter((c): c is string => !!c && !defaultSet.has(c));
  const uniqueCustom = Array.from(new Set(customFromRecords)).sort();
  const categoriesForFilter = [...DEFAULT_CATEGORIES, ...uniqueCustom];
  const filteredRecords = selectedCategory
    ? records.filter((r) => r.category === selectedCategory)
    : records;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" aria-hidden />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {familyMembers.length > 0 && (
          <div>
            <label htmlFor="timeline-person" className="block text-sm font-medium text-foreground">
              Ver historial de
            </label>
            <select
              id="timeline-person"
              value={selectedFamilyId}
              onChange={(e) => setSelectedFamilyId(e.target.value)}
              className="mt-1 flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-foreground"
              aria-label="Filtrar por persona"
            >
              <option value="">Todos</option>
              {familyMembers.map((fm) => (
                <option key={fm.id} value={fm.id}>
                  {fm.name} — {fm.relationship}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="timeline-category" className="block text-sm font-medium text-foreground">
            Categoría
          </label>
          <select
            id="timeline-category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="mt-1 flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-foreground"
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas</option>
            {categoriesForFilter.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" aria-hidden />
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/60" aria-hidden />
          <p className="mt-3 text-sm font-medium text-foreground">
            {selectedFamilyId || selectedCategory ? "No hay registros con estos filtros" : "Aún no hay registros"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Lo que agregues aparecerá aquí en orden cronológico
          </p>
          <Link href="/registro/nuevo" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Agregar evento médico
          </Link>
        </div>
      ) : (
    <ul className="space-y-4">
      {filteredRecords.map((record) => {
        const member = record.family_members as { name: string; relationship: string } | undefined;
        const date = new Date(record.event_date + "T12:00:00");
        const hasPhoto = !!record.photo_url;
        return (
          <li key={record.id} className="relative flex gap-4">
            <div className="flex shrink-0 flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                {hasPhoto ? <ImageIcon className="h-5 w-5" aria-hidden /> : <FileText className="h-5 w-5" aria-hidden />}
              </div>
              <div className="mt-1 h-full w-px bg-border" aria-hidden />
            </div>
            <Link href={`/timeline/${record.id}`} className="min-w-0 flex-1 rounded-xl border border-border bg-card p-4 pb-6 transition-colors hover:bg-accent/30">
              <p className="text-xs font-medium text-muted-foreground">
                {member?.name ?? "Familiar"} · {format(date, "d MMM yyyy", { locale: es })}
              </p>
              <h3 className="mt-1 font-medium text-foreground">{record.title}</h3>
              {record.category && (
                <span className="mt-1 inline-block rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                  {record.category}
                </span>
              )}
              {record.description && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{record.description}</p>
              )}
              {hasPhoto && (
                <div className="mt-3 flex items-center gap-2 text-xs text-primary">
                  <ImageIcon className="h-4 w-4" aria-hidden />
                  <span>Ver foto</span>
                </div>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
      )}
    </div>
  );
}
