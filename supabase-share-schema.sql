-- ============================================
-- D&D Character Sheet — Share links (дополнение)
-- Запустить в Supabase SQL Editor ПОСЛЕ supabase-schema.sql
-- Скрипт аддитивный: существующие таблицы и политики не меняет.
-- ============================================

-- Публичные ссылки на персонажа: по короткому коду любой может прочитать
-- СНИМОК данных. Снимок, а не ссылка на characters — чтобы не открывать
-- публичный доступ к самой таблице characters (её RLS остаётся строгим).
CREATE TABLE IF NOT EXISTS character_shares (
  code TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  character_id UUID REFERENCES characters ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Безымянный',
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Для существующих таблиц: снимаем ограничение NOT NULL с user_id для поддержки анонимных ссылок
ALTER TABLE character_shares ALTER COLUMN user_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS character_shares_user_id_idx ON character_shares (user_id);

ALTER TABLE character_shares ENABLE ROW LEVEL SECURITY;

-- Чтение по коду доступно всем (в т.ч. анонимам): код и есть секрет.
-- Прямой SELECT из таблицы открыт только владельцу ссылки — иначе с публичным anon-ключом
-- можно было бы выгрузить все снимки. Остальные читают через функцию, которой нужен код.
DROP POLICY IF EXISTS "Anyone can read active shares" ON character_shares;
DROP POLICY IF EXISTS "Owners can read own shares" ON character_shares;
CREATE POLICY "Owners can read own shares" ON character_shares
  FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_character_share(p_code TEXT)
RETURNS TABLE (
  code TEXT,
  name TEXT,
  data JSONB,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.code, s.name, s.data, s.created_at, s.expires_at
  FROM public.character_shares s
  WHERE s.code = p_code
    AND (s.expires_at IS NULL OR s.expires_at > NOW())
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_character_share(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_character_share(TEXT) TO anon, authenticated;

-- Создавать ссылки могут как авторизованные пользователи, так и анонимные гости.
DROP POLICY IF EXISTS "Users can create own shares" ON character_shares;
DROP POLICY IF EXISTS "Anyone can insert shares" ON character_shares;
CREATE POLICY "Anyone can insert shares" ON character_shares
  FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own shares" ON character_shares;
CREATE POLICY "Users can update own shares" ON character_shares
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own shares" ON character_shares;
CREATE POLICY "Users can delete own shares" ON character_shares
  FOR DELETE USING (auth.uid() = user_id);
