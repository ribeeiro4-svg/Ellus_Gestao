
'use server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getMyTenantIdAction() {
  const cookieStore = cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
      },
    }
  )

  const { data: { user } } = await sb.auth.getUser()
  
  if (user) {
    // 1. JWT Metadata (Mais confiável e rápido)
    const metaTenant = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
    // 1. Tentar resolver pelo cliente padrão (com sessão e RLS)
    const { createServerSupabase } = await import('@/lib/supabase/server')
    const sb = await createServerSupabase()
    const { data: userData } = await sb.from('usuarios').select('tenant_id').eq('id', user.id).maybeSingle()
    if (userData?.tenant_id) return userData.tenant_id

    // 2. Database Fallback (usando admin se disponível)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (url && key) {
      const { createClient } = await import('@supabase/supabase-js')
      const sbAdmin = createClient(url, key)
      const { data: adminData } = await sbAdmin.from('usuarios').select('tenant_id').eq('id', user.id).maybeSingle()
      if (adminData?.tenant_id) return adminData.tenant_id
    }
  }

  // Fallback final apenas se tudo falhar (ID Bruno/Matriz original)
  return '15782181-31a9-4d9a-9cde-315cf84aec5a'
}
