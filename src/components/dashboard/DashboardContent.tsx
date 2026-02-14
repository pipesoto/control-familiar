"use client";

import { useEffect, useState } from "react";
import { Calendar, User } from "lucide-react";
import Link from "next/link";
import type { Appointment, FamilyMember } from "@/types/database";

type AppointmentWithMember = Appointment & {
  family_members?: { name: string; relationship: string } | null;
};

function countUpcomingByMember(
  appointments: AppointmentWithMember[],
  now: string
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const apt of appointments) {
    if (apt.scheduled_at >= now) {
      const id = apt.family_member_id;
      counts[id] = (counts[id] ?? 0) + 1;
    }
  }
  return counts;
}

function statusText(count: number): string {
  if (count === 0) return "Todo al día";
  if (count === 1) return "Tienes 1 cita pendiente";
  return `Tienes ${count} citas pendientes`;
}

export function DashboardContent() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [appointments, setAppointments] = useState<AppointmentWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        if (!supabase) {
          setFamilyMembers([]);
          setAppointments([]);
          setLoading(false);
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setFamilyMembers([]);
          setAppointments([]);
          setLoading(false);
          return;
        }

        const [fmRes, aptRes] = await Promise.all([
          supabase.from("family_members").select("*").eq("user_id", session.user.id),
          supabase
            .from("appointments")
            .select(`*, family_members (name, relationship)`)
            .order("scheduled_at", { ascending: true }),
        ]);

        if (fmRes.error) throw fmRes.error;
        if (aptRes.error) throw aptRes.error;

        setFamilyMembers((fmRes.data ?? []) as FamilyMember[]);
        setAppointments((aptRes.data ?? []) as AppointmentWithMember[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar");
        setFamilyMembers([]);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const now = new Date().toISOString();
  const countsByMember = countUpcomingByMember(appointments, now);

  if (loading) {
    return (
      <section aria-label="Estado por integrante" className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-medium text-foreground">
          <Calendar className="h-5 w-5 text-primary" aria-hidden />
          Estado por integrante
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-muted"
              aria-hidden
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Estado por integrante" className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-medium text-foreground">
        <Calendar className="h-5 w-5 text-primary" aria-hidden />
        Estado por integrante
      </h2>

      {error && (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          {error}
        </p>
      )}

      {familyMembers.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <User className="mx-auto h-12 w-12 text-muted-foreground/60" aria-hidden />
          <p className="mt-3 text-sm font-medium text-foreground">
            Aún no hay integrantes
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Agrega familiares en Perfil para ver su estado aquí
          </p>
          <Link
            href="/perfil"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            Ir a Perfil
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {familyMembers.map((member) => {
            const count = countsByMember[member.id] ?? 0;
            const text = statusText(count);
            return (
              <li key={member.id}>
                <Link
                  href="/agenda"
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/30"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <User className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      {member.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.relationship} · {text}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {familyMembers.length > 0 && (
        <Link
          href="/agenda"
          className="block text-center text-sm font-medium text-primary hover:underline"
        >
          Ver agenda completa
        </Link>
      )}
    </section>
  );
}
