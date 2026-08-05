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
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  character_id UUID REFERENCES characters ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Безымянный',
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS character_shares_user_id_idx ON character_shares (user_id);

ALTER TABLE character_shares ENABLE ROW LEVEL SECURITY;

-- Чтение по коду доступно всем (в т.ч. анонимам): код и есть секрет.
-- Истёкшие ссылки не отдаются.
DROP POLICY IF EXISTS "Anyone can read active shares" ON character_shares;
CREATE POLICY "Anyone can read active shares" ON character_shares
  FOR SELECT USING (expires_at IS NULL OR expires_at > NOW());

-- Создавать, обновлять и удалять ссылки может только владелец.
DROP POLICY IF EXISTS "Users can create own shares" ON character_shares;
CREATE POLICY "Users can create own shares" ON character_shares
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own shares" ON character_shares;
CREATE POLICY "Users can update own shares" ON character_shares
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own shares" ON character_shares;
CREATE POLICY "Users can delete own shares" ON character_shares
  FOR DELETE USING (auth.uid() = user_id);
