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

export function DashboardContent() {
  const [appointments, setAppointments] = useState<AppointmentWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from("appointments")
          .select(`
            *,
            family_members (name, relationship)
          `)
          .order("scheduled_at", { ascending: true });

        if (appointmentsError) throw appointmentsError;

        const list = (appointmentsData ?? []) as AppointmentWithMember[];
        const now = new Date().toISOString();
        const upcoming = list.filter((a) => a.scheduled_at >= now);
        setAppointments(upcoming.slice(0, 5));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar");
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, []);

  if (loading) {
    return (
      <section aria-label="Próximos controles" className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-medium text-foreground">
          <Calendar className="h-5 w-5 text-primary" aria-hidden />
          Próximos controles
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-muted"
              aria-hidden
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Próximos controles" className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-medium text-foreground">
        <Calendar className="h-5 w-5 text-primary" aria-hidden />
        Próximos controles
      </h2>

      {error && (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          Mostrando datos de ejemplo. Configura Supabase para ver tus datos.
        </p>
      )}

      {appointments.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/60" aria-hidden />
          <p className="mt-3 text-sm font-medium text-foreground">
            No hay controles programados
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Toca el botón + para agregar una cita
          </p>
          <Link
            href="/registro/nuevo"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            Agregar control
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {appointments.map((apt) => {
            const member = apt.family_members as { name: string; relationship: string } | undefined;
            const date = new Date(apt.scheduled_at);
            const label =
              date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth()
                ? "Hoy"
                : date.getDate() === new Date().getDate() + 1 && date.getMonth() === new Date().getMonth()
                ? "Mañana"
                : format(date, "EEEE d MMM", { locale: es });

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
                    <p className="font-medium text-foreground truncate">
                      {member?.name ?? "Familiar"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {apt.specialty ?? "Control"} · {label},{" "}
                      {format(date, "HH:mm", { locale: es })}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {appointments.length > 0 && (
        <Link
          href="/agenda"
          className="block text-center text-sm font-medium text-primary hover:underline"
        >
          Ver toda la agenda
        </Link>
      )}
    </section>
  );
}
