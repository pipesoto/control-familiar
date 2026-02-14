import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json(
        { error: "Faltan email o contraseña" },
        { status: 400 }
      );
    }
    const supabase = createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase no configurado" },
        { status: 500 }
      );
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({
      session: data.session,
      user: data.user,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error en el servidor";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
