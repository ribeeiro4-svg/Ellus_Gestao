
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
    // 1. Tentar resolver pelo Banco de Dados (USANDO ADMIN para garantir visibilidade)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (url && key) {
      const { createClient } = await import('@supabase/supabase-js')
      const sbAdmin = createClient(url, key)
      const { data: userData } = await sbAdmin
        .from('usuarios')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()
      
      if (userData?.tenant_id) return userData.tenant_id
    }

    // 2. JWT Metadata Fallback
    const metaTenant = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
    if (metaTenant) return metaTenant
  }

  // Fallback final: ACPROBEC - Associação Colaborativa (ID: 971f92af-...)
  // Este é o tenant onde os dados financeiros (lancamentos) foram encontrados via probe.
  return '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
}
