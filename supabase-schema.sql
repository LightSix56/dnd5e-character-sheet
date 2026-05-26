-- ============================================
-- D&D Character Sheet — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Characters table
CREATE TABLE IF NOT EXISTS characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Безымянный',
  data JSONB NOT NULL DEFAULT '{}',
  portrait_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own characters" ON characters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own characters" ON characters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own characters" ON characters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own characters" ON characters FOR DELETE USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON characters;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3. Storage bucket for portraits
INSERT INTO storage.buckets (id, name, public) VALUES ('portraits', 'portraits', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for portraits bucket
CREATE POLICY "Users can upload own portraits"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'portraits' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own portraits"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'portraits' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own portraits"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'portraits' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view portraits"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portraits');
