
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
    if (metaTenant) return metaTenant

    // 2. Database Fallback (usando admin para evitar RLS/406)
    const { createClient } = await import('@supabase/supabase-js')
    const sbAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: userData } = await sbAdmin.from('usuarios').select('tenant_id').eq('id', user.id).maybeSingle()
    if (userData?.tenant_id) return userData.tenant_id
  }

  return '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
}
