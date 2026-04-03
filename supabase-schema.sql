-- ============================================
-- SCHEMA INTELIGÊNCIA VIAGENS — Supabase SQL
-- Execute no Supabase > SQL Editor
-- ============================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---- Perfis de usuário ----
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  avatar_url    TEXT,
  preferred_currency    TEXT DEFAULT 'BRL',
  preferred_language    TEXT DEFAULT 'both',
  home_airport          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Conversas ----
CREATE TABLE IF NOT EXISTS public.conversations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT DEFAULT 'Nova conversa',
  status        TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Mensagens ----
CREATE TABLE IF NOT EXISTS public.messages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id   UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content           TEXT NOT NULL,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Pacotes de viagem salvos ----
CREATE TABLE IF NOT EXISTS public.travel_packages (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id     UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  title               TEXT NOT NULL,
  destination         TEXT NOT NULL,
  destination_country TEXT,
  check_in            DATE,
  check_out           DATE,
  adults              INT DEFAULT 1,
  children            INT DEFAULT 0,
  flight_data         JSONB DEFAULT '{}',
  hotel_data          JSONB DEFAULT '{}',
  activities_data     JSONB DEFAULT '[]',
  weather_data        JSONB DEFAULT '{}',
  total_price         NUMERIC,
  currency            TEXT DEFAULT 'BRL',
  status              TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'saved', 'booked')),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Cache de buscas (evita repetir chamadas à SerpApi) ----
CREATE TABLE IF NOT EXISTS public.search_cache (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key   TEXT UNIQUE NOT NULL,
  data        JSONB NOT NULL,
  search_type TEXT NOT NULL CHECK (search_type IN ('flights', 'hotels', 'activities', 'weather')),
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ---- Índices ----
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_travel_packages_user_id ON public.travel_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_search_cache_key ON public.search_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON public.search_cache(expires_at);

-- ---- Row Level Security ----
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;

-- Policies: usuário só vê seus próprios dados
CREATE POLICY "profiles: own data" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "conversations: own data" ON public.conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "messages: own data" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "travel_packages: own data" ON public.travel_packages
  FOR ALL USING (auth.uid() = user_id);

-- Cache é leitura pública (não contém dados pessoais)
CREATE POLICY "search_cache: read all" ON public.search_cache
  FOR SELECT USING (true);
CREATE POLICY "search_cache: insert authenticated" ON public.search_cache
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ---- Trigger: criar perfil automaticamente ao registrar ----
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ---- Trigger: updated_at automático ----
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_conversations
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

CREATE TRIGGER set_updated_at_packages
  BEFORE UPDATE ON public.travel_packages
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

-- ✅ Schema criado com sucesso!
-- Próximo passo: configure o Auth no Supabase Dashboard
--   Authentication > Providers > Email (ativo por padrão)
--   Authentication > Providers > Google (opcional)
--   Authentication > URL Configuration > Site URL: http://localhost:3000
