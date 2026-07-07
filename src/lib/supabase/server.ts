import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createServerSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, opts: CookieOptions) {
          try { cookieStore.set({ name, value, ...opts }) } catch {}
        },
        remove(name: string, opts: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...opts }) } catch {}
        },
      },
    }
  )
}

/**
 * Cliente Supabase com service role key — bypassa RLS.
 * Usar SOMENTE em Server Actions para operações privilegiadas
 * como logs de auditoria, histórico de versões e fechamento fiscal.
 */
export async function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
