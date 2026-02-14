import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName } = body;
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
    // Log para depurar: qué URL usa el servidor (solo al iniciar la petición)
    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    if (envUrl.includes("tu-proyecto")) {
      console.warn("[signup] AVISO: NEXT_PUBLIC_SUPABASE_URL sigue siendo el ejemplo. Reinicia el servidor (Ctrl+C y npm run dev) tras editar .env.local");
    } else {
      console.log("[signup] Usando Supabase:", envUrl.replace(/https?:\/\//, "").split("/")[0]);
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName ?? "" } },
    });
    if (error) {
      console.error("[signup] Supabase error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({
      session: data.session,
      user: data.user,
      message: "Revisa tu correo para confirmar la cuenta (si está habilitado).",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error en el servidor";
    console.error("[signup] Error:", e);
    if (msg === "fetch failed" || msg.toLowerCase().includes("fetch")) {
      return NextResponse.json(
        {
          error:
            "El servidor no pudo conectar con Supabase. Revisa: 1) Proyecto no pausado en app.supabase.com 2) Firewall/antivirus no bloquea Node 3) Internet activo.",
        },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
