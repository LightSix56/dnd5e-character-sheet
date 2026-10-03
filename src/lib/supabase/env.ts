const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_ANON_KEY = 'placeholder-anon-key';

/**
 * Единая точка чтения настроек Supabase.
 * Без .env приложение работает в локальном режиме: клиент создаётся с заглушками,
 * а серверные роуты проверяют isSupabaseConfigured() и не ходят в сеть.
 */
export function getSupabaseEnv(): { url: string; anonKey: string } {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PLACEHOLDER_ANON_KEY,
  };
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && anonKey && url !== PLACEHOLDER_URL && anonKey !== PLACEHOLDER_ANON_KEY);
}
