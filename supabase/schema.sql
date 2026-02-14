-- SaludFamiliar - Schema inicial para Supabase (PostgreSQL)
-- Ejecutar en el SQL Editor de tu proyecto Supabase

-- Habilitar extensión UUID si no está
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. TABLA: profiles (perfil del usuario principal, vinculado a auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger para crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 2. TABLA: family_members (familiares del usuario principal)
-- =============================================
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,  -- madre, hijo/a, dependiente, etc.
  birth_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_family_members_user_id ON public.family_members(user_id);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own family members"
  ON public.family_members
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 3. TABLA: medical_records (eventos/registros médicos realizados)
-- =============================================
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  category TEXT,  -- control, receta, examen, vacuna, etc.
  photo_url TEXT,  -- URL en Supabase Storage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_medical_records_family_member ON public.medical_records(family_member_id);
CREATE INDEX idx_medical_records_event_date ON public.medical_records(event_date DESC);

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage medical records of own family"
  ON public.medical_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.id = medical_records.family_member_id AND fm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.id = medical_records.family_member_id AND fm.user_id = auth.uid()
    )
  );

-- =============================================
-- 4. TABLA: appointments (próximos controles/citas)
-- =============================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  specialty TEXT,  -- pediatría, ginecología, etc.
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_family_member ON public.appointments(family_member_id);
CREATE INDEX idx_appointments_scheduled_at ON public.appointments(scheduled_at ASC);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage appointments of own family"
  ON public.appointments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.id = appointments.family_member_id AND fm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.id = appointments.family_member_id AND fm.user_id = auth.uid()
    )
  );

-- =============================================
-- Storage bucket para fotos de respaldo (recetas, exámenes)
-- Ejecutar en Dashboard de Supabase > Storage > New bucket: "medical-photos"
-- Política: permitir upload/read solo a usuarios autenticados para sus archivos
-- =============================================
-- INSERT manual o vía Dashboard. Ejemplo de política Storage:
-- CREATE POLICY "Users can upload medical photos"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'medical-photos' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can read own medical photos"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'medical-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
