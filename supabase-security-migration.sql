-- ============================================
-- D&D Character Sheet — Security migration
-- Запустить ОДИН РАЗ в Supabase SQL Editor на существующей базе
-- (после supabase-schema.sql и supabase-share-schema.sql).
-- Скрипт идемпотентный: повторный запуск ничего не ломает.
-- Данные не изменяются и не удаляются — меняются только политики доступа.
-- ============================================

-- 1. Шаринг-ссылки.
-- Раньше политика "Anyone can read active shares" разрешала SELECT всех неистёкших строк,
-- то есть с публичным anon-ключом можно было выгрузить таблицу целиком.
-- Теперь таблица закрыта, а снимок по коду отдаёт функция: без кода ничего не прочитать.
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

-- 2. Профили.
-- username по умолчанию берётся из части email до "@", поэтому чтение всех профилей
-- раскрывало адреса пользователей. Оставляем доступ только к своему профилю.
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 3. Портреты.
-- Бакет публичный: файл открывается по прямой ссылке и без политики SELECT.
-- Политика "Anyone can view portraits" дополнительно позволяла любому получить
-- список всех файлов бакета. Оставляем листинг только владельцу папки.
DROP POLICY IF EXISTS "Anyone can view portraits" ON storage.objects;

DROP POLICY IF EXISTS "Users can list own portraits" ON storage.objects;
CREATE POLICY "Users can list own portraits"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portraits' AND auth.uid()::text = (storage.foldername(name))[1]);
