import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseEnv } from './env';

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

interface RouteClientOptions {
  /** Пробросить заголовок Authorization (Bearer JWT) в запросы к Supabase. */
  forwardAuth?: boolean;
  /** Не читать cookies запроса — полностью анонимный клиент. */
  anonymous?: boolean;
  /** Ответ, в который нужно записывать обновлённые auth-cookies. */
  response?: NextResponse;
}

/** Клиент Supabase для Route Handlers. Один на все API-роуты вместо копий в каждом файле. */
export function createRouteClient(request: NextRequest, options: RouteClientOptions = {}) {
  const { url, anonKey } = getSupabaseEnv();
  const authHeader = options.forwardAuth ? request.headers.get('Authorization') : null;
  const { response } = options;

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return options.anonymous ? [] : request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        if (!response) return;
        // На запросе — чтобы последующие чтения в этом же обработчике видели новые значения,
        // на ответе — чтобы браузер получил Set-Cookie.
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options: cookieOptions }) =>
          response.cookies.set(name, value, cookieOptions)
        );
      },
    },
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}

export function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

/** Пользователь по Bearer-токену, а если его нет или он не прошёл проверку — по cookie-сессии. */
export async function getAuthenticatedUser(
  supabase: ReturnType<typeof createRouteClient>,
  request: NextRequest
) {
  const bearerToken = getBearerToken(request);

  if (bearerToken) {
    const { data: { user }, error } = await supabase.auth.getUser(bearerToken);
    if (user) return { user, error: null };
    if (error) console.warn('[Auth] Bearer token verification failed:', error.message);
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}
