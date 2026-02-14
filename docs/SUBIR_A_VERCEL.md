# Subir SaludFamiliar a Vercel (con GitHub)

Tu repo: **https://github.com/pipesoto/control-familiar.git**

---

## Paso 1: Subir el código a GitHub

Abre una terminal **en la carpeta del proyecto** (donde está `package.json`) y ejecuta:

```bash
# Si aún no tienes git inicializado
git init

# Conectar con tu repo (si ya tenías otro remote, usa: git remote set-url origin https://github.com/pipesoto/control-familiar.git)
git remote add origin https://github.com/pipesoto/control-familiar.git

# Ver qué archivos se van a subir (no debe aparecer .env.local)
git status

# Añadir todo el proyecto
git add .

# Primer commit
git commit -m "SaludFamiliar: app controles médicos con Next.js, Supabase, historial y agenda"

# Subir a GitHub (rama main)
git branch -M main
git push -u origin main
```

Si te pide usuario y contraseña, usa tu usuario de GitHub y un **Personal Access Token** (no la contraseña de la cuenta). En GitHub: Settings → Developer settings → Personal access tokens → crear uno con permiso `repo`.

---

## Paso 2: Conectar el repo con Vercel

1. Entra a **https://vercel.com** e inicia sesión (con GitHub si quieres).
2. Clic en **Add New…** → **Project**.
3. **Import** el repositorio **pipesoto/control-familiar** (si no sale, conecta tu cuenta de GitHub a Vercel).
4. En **Configure Project**:
   - **Framework Preset**: Next.js (debería detectarse solo).
   - **Root Directory**: dejar vacío.
   - **Build Command**: `npm run build` (por defecto).
   - **Output Directory**: por defecto.

---

## Paso 3: Variables de entorno en Vercel

Antes de hacer **Deploy**, añade las variables de Supabase:

1. En la misma pantalla de Vercel, despliega la sección **Environment Variables**.
2. Añade:

   | Name | Value |
   |------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Tu URL de Supabase (ej. `https://rwfzgzuhobziztkygnan.supabase.co`) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tu clave anon/public de Supabase |

   Los valores son los mismos que tienes en tu `.env.local` (cópialos de ahí).

3. Clic en **Deploy**.

---

## Paso 4: Después del deploy

- Vercel te dará una URL tipo **https://control-familiar-xxx.vercel.app**.
- En **Supabase** (Authentication → URL Configuration) añade en **Redirect URLs** tu URL de Vercel, por ejemplo: `https://control-familiar-xxx.vercel.app/**`.
- Prueba registro e inicio de sesión en esa URL.

---

## Resumen

| Paso | Dónde | Qué hacer |
|------|--------|-----------|
| 1 | Terminal (en el proyecto) | `git add .` → `git commit -m "..."` → `git push -u origin main` |
| 2 | vercel.com | Add New → Project → Import **pipesoto/control-familiar** |
| 3 | Vercel (Environment Variables) | Añadir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| 4 | Vercel | Deploy |
| 5 | Supabase | Añadir la URL de Vercel en Redirect URLs (Auth) |

**Importante:** No subas `.env.local` a GitHub (ya está en `.gitignore`). Las variables las configuras solo en Vercel.
