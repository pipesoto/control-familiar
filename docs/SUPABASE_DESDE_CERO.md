# Configurar Supabase desde cero (SaludFamiliar)

Guía paso a paso para tener Supabase listo y conectado a tu app.

> **Seguridad:** Usa solo la clave **Publishable** (o anon) en tu app. La clave **Secret** (`sb_secret_...`) **nunca** debe ir en el frontend ni compartirse en chat o repos. Si la expones, regenérala en Supabase (API → Secret keys → Regenerate).

---

## Paso 1: Crear cuenta y proyecto en Supabase

1. Entra a **https://supabase.com** y haz clic en **Start your project**.
2. Inicia sesión con **GitHub**, **Google** o tu email.
3. Crea una **organización** (si te lo pide): ponle un nombre, por ejemplo "Mi Org".
4. Crea un **nuevo proyecto**:
   - **Name**: `salud-familiar` (o el que quieras).
   - **Database Password**: inventa una contraseña **fuerte** y **guárdala** (la necesitas para conectar con herramientas externas; la app usa la API, no esta contraseña).
   - **Region**: elige la más cercana (ej. South America (São Paulo)).
5. Haz clic en **Create new project** y espera 1–2 minutos a que termine de crearse.

---

## Paso 2: Obtener la URL y la clave (API Keys)

1. En el panel de Supabase, en el menú izquierdo ve a **Project Settings** (icono de engranaje).
2. Entra a **API** en el submenú.
3. Ahí verás:
   - **Project URL**: algo como `https://abcdefghijk.supabase.co`
   - **Publishable key** (clave que empieza con `sb_publishable_...`) — **esta es la que usa tu app en el frontend.**
   - **Secret key** (`sb_secret_...`) — **no la uses en el frontend ni la compartas.**
4. **Para tu `.env.local` solo necesitas:**
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (copiar completa) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> La **Publishable key** es segura en el navegador. Supabase usa Row Level Security (RLS) para que cada usuario solo vea sus datos. La **Secret key** solo en backend (servidor), nunca en el cliente.

---

## Paso 3: Crear las tablas en la base de datos

1. En el menú izquierdo de Supabase entra a **SQL Editor**.
2. Haz clic en **New query**.
3. Abre el archivo **`supabase/schema.sql`** de este proyecto en tu editor y **copia todo** su contenido.
4. Pégalo en el editor SQL de Supabase.
5. Haz clic en **Run** (o Ctrl+Enter).
6. Debe decir algo como "Success. No rows returned". Con eso ya tienes creadas las tablas:
   - `profiles`
   - `family_members`
   - `medical_records`
   - `appointments`
   y las políticas de seguridad (RLS).

Si sale algún error, revisa que no hayas ejecutado el mismo script dos veces (algunos objetos ya existirían). En ese caso puedes crear un proyecto nuevo o comentar las líneas que fallen.

---

## Paso 4: Poner la URL y la clave en tu proyecto (Next.js)

1. En la raíz del proyecto (donde está `package.json`) crea un archivo llamado **`.env.local`** (si no existe).
2. Abre `.env.local` y pega esto, **reemplazando** por tus valores reales del Paso 2:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Guarda el archivo.

> **Importante**: No subas `.env.local` a Git. En este proyecto suele estar en `.gitignore`. En Vercel tendrás que configurar estas mismas variables en el panel del proyecto.

---

## Paso 5: Reiniciar la app y probar

1. Si tenías la app corriendo, detén el servidor (Ctrl+C) y vuelve a ejecutar:

```bash
npm run dev
```

2. Abre **http://localhost:3000**.  
   Si la URL y la clave están bien, el Dashboard debería poder conectar con Supabase (aunque aún no tengas citas; en ese caso verás "No hay controles programados" o datos vacíos).

---

## Paso 6 (opcional): Bucket para fotos (recetas / exámenes)

Para que más adelante puedas subir fotos de recetas o exámenes:

1. En Supabase ve a **Storage** en el menú izquierdo.
2. Clic en **New bucket**.
3. **Name**: `medical-photos`
4. Puedes dejarlo **Public** desactivado (acceso solo con autenticación).
5. Clic en **Create bucket**.
6. Después en **Policies** del bucket puedes añadir políticas para que los usuarios autenticados puedan subir y leer sus propios archivos (esto lo puedes hacer cuando implementes el upload en la app).

---

## Resumen rápido

| Qué necesitas | Dónde |
|---------------|--------|
| Cuenta y proyecto | https://supabase.com → New project |
| URL y anon key | Project Settings → API |
| Tablas y seguridad | SQL Editor → pegar `supabase/schema.sql` → Run |
| Variables en Next.js | Archivo `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

Si algo falla, revisa:
- Que la URL no tenga espacio ni barra al final.
- Que la anon key esté completa (suele ser muy larga).
- Que hayas ejecutado todo el `schema.sql` sin errores.

Cuando tengas esto, tu app SaludFamiliar ya está conectada a Supabase desde cero.

---

## Si el registro o login fallan

1. **"No se pudo conectar" / "Failed to fetch"**
   - Asegúrate de tener el servidor corriendo: `npm run dev`.
   - La app llama a `/api/auth/signup` y `/api/auth/login` (tu servidor); si el servidor no está arriba, verás este error.

2. **Error 400 con mensaje de Supabase**
   - **"User already registered"**: Ese email ya está registrado. Usa **Iniciar sesión** o otro email.
   - **"Email not confirmed"**: En Supabase ve a **Authentication → Providers → Email** y desactiva **"Confirm email"** para poder entrar sin confirmar por correo (útil en desarrollo).
   - **"Password should be at least 6 characters"**: Usa una contraseña de al menos 6 caracteres.

3. **"Supabase no configurado"**
   - Revisa que exista `.env.local` en la raíz del proyecto con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Reinicia el servidor (`Ctrl+C` y luego `npm run dev`).

4. **Ver el error exacto en la terminal**
   - Al intentar registrarte, en la terminal donde corre `npm run dev` puede aparecer `[signup] Supabase error: ...` con el mensaje que devuelve Supabase.

---

## Bucket para fotos (recetas, exámenes)

Para poder subir fotos en **Nuevo registro** (evento médico):

1. En Supabase ve a **Storage** en el menú izquierdo.
2. Clic en **New bucket**.
3. **Name**: `medical-photos`
4. Marca **Public bucket** si quieres que las fotos tengan URL pública (recomendado para verlas en la app).
5. Clic en **Create bucket**.
6. En el bucket, entra a **Policies** → **New policy** → "For full customization" y añade una política que permita a usuarios autenticados subir y leer sus archivos. Ejemplo (SQL):
   - **INSERT**: `(bucket_id = 'medical-photos' AND auth.role() = 'authenticated')`
   - **SELECT**: `(bucket_id = 'medical-photos' AND auth.role() = 'authenticated')`

Sin este bucket, el registro con foto fallará; el registro sin foto seguirá funcionando.
