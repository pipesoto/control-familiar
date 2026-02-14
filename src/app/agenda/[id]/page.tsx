"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Calendar, User, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Appointment } from "@/types/database";

type AppointmentWithMember = Appointment & {
  family_members?: { name: string; relationship: string } | null;
};

export default function AgendaDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [appointment, setAppointment] = useState<AppointmentWithMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchAppointment() {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      // Mock IDs from dashboard
      if (id === "mock-1" || id === "mock-2") {
        const in3Days = new Date();
        in3Days.setDate(in3Days.getDate() + (id === "mock-1" ? 3 : 7));
        setAppointment({
          id,
          family_member_id: "mock-fm",
          scheduled_at: in3Days.toISOString(),
          specialty: id === "mock-1" ? "Control prenatal" : "Pediatría",
          notes: null,
          reminder_sent: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          family_members: id === "mock-1" ? { name: "María", relationship: "madre" } : { name: "Sofía", relationship: "hija" },
        });
        setLoading(false);
        return;
      }
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        if (!supabase) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from("appointments")
          .select(`
            *,
            family_members (name, relationship)
          `)
          .eq("id", id)
          .single();

        if (error || !data) {
          setNotFound(true);
        } else {
          setAppointment(data as AppointmentWithMember);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchAppointment();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (notFound || !appointment) {
    return (
      <div className="space-y-6">
        <Link href="/agenda" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Volver a la agenda
        </Link>
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="font-medium text-foreground">Cita no encontrada</p>
          <p className="mt-1 text-sm text-muted-foreground">Es posible que se haya eliminado.</p>
          <Link href="/agenda">
            <Button variant="outline" className="mt-4">Ver agenda</Button>
          </Link>
        </div>
      </div>
    );
  }

  const member = appointment.family_members as { name: string; relationship: string } | undefined;
  const date = new Date(appointment.scheduled_at);
  const whatsappText = encodeURIComponent(
    `Recordatorio: ${member?.name ?? "Familiar"} - ${appointment.specialty ?? "Control"} el ${format(date, "d/M/yyyy", { locale: es })} a las ${format(date, "HH:mm", { locale: es })}.`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

  return (
    <div className="space-y-6">
      <Link href="/agenda" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Volver a la agenda
      </Link>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <User className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{member?.name ?? "Familiar"}</h1>
            <p className="text-sm text-muted-foreground">{member?.relationship}</p>
          </div>
        </div>

        <dl className="mt-6 space-y-4 border-t border-border pt-4">
          <div className="flex gap-3">
            <Calendar className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Fecha y hora</dt>
              <dd className="text-foreground">
                {format(date, "EEEE d 'de' MMMM, HH:mm", { locale: es })}
              </dd>
            </div>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Especialidad</dt>
            <dd className="text-foreground">{appointment.specialty ?? "Control"}</dd>
          </div>
          {appointment.notes && (
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Notas</dt>
              <dd className="text-foreground">{appointment.notes}</dd>
            </div>
          )}
        </dl>

        <div className="mt-6 pt-4 border-t border-border">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#20BD5A]"
          >
            <MessageCircle className="h-5 w-5" aria-hidden />
            Compartir por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
