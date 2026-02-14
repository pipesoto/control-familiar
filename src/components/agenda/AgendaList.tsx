"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import type { Appointment } from "@/types/database";

type AppointmentWithMember = Appointment & {
  family_members?: { name: string; relationship: string } | null;
};

export function AgendaList() {
  const [appointments, setAppointments] = useState<AppointmentWithMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        if (!supabase) {
          setAppointments([]);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from("appointments")
          .select(`
            *,
            family_members (name, relationship)
          `)
          .order("scheduled_at", { ascending: true });

        if (error) throw error;

        const list = (data ?? []) as AppointmentWithMember[];
        const now = new Date().toISOString();
        const upcoming = list.filter((a) => a.scheduled_at >= now);
        setAppointments(upcoming);
      } catch {
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" aria-hidden />
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground/60" aria-hidden />
        <p className="mt-3 text-sm font-medium text-foreground">No hay citas programadas</p>
        <p className="mt-1 text-xs text-muted-foreground">Usa el botón + para agregar una cita</p>
        <Link href="/registro/nuevo" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Agregar cita
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {appointments.map((apt) => {
        const member = apt.family_members as { name: string; relationship: string } | undefined;
        const date = new Date(apt.scheduled_at);
        const isToday = date.toDateString() === new Date().toDateString();
        const isTomorrow = (() => {
          const t = new Date();
          t.setDate(t.getDate() + 1);
          return date.toDateString() === t.toDateString();
        })();
        const label = isToday ? "Hoy" : isTomorrow ? "Mañana" : format(date, "EEEE d MMM", { locale: es });

        return (
          <li key={apt.id}>
            <Link
              href={`/agenda/${apt.id}`}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/50"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <User className="h-6 w-6" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">{member?.name ?? "Familiar"}</p>
                <p className="text-sm text-muted-foreground">
                  {apt.specialty ?? "Control"} · {label}, {format(date, "HH:mm", { locale: es })}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
