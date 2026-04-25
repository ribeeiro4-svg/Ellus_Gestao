'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook de Identidade ACPROBEC - VERSÃO DINÂMICA
 * Busca o ID do Tenant do usuário logado ou usa o fallback padrão.
 */
export function useTenantId() {
  const [tenantId, setTenantId] = useState<string | null>(null)
  
  useEffect(() => {
    const sb = createClient();
    let mounted = true;
    
    async function resolveTenant() {
      // Tenta até 3 vezes com pequenos intervalos em caso de erro 406 transiente
      for (let attempt = 0; attempt < 3; attempt++) {
        if (!mounted) return;

        const { data: { user } } = await sb.auth.getUser()
        if (user) {
          // 1. JWT Metadata
          const metaTenant = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
          if (metaTenant) {
            setTenantId(metaTenant)
            return
          }

          // 2. Database Fallback (com tratamento de erro)
          const { data: userData, error } = await sb.from('usuarios').select('tenant_id').eq('id', user.id).maybeSingle()
          if (!error && userData?.tenant_id) {
            setTenantId(userData.tenant_id)
            return
          }
        }
        
        // Se não conseguiu, espera um pouco e tenta de novo
        await new Promise(r => setTimeout(r, 1000))
      }

      // Fallback final se tudo falhar após as tentativas
      if (mounted) setTenantId('971f92af-a72b-4bc4-a8e0-333d712ce6a7')
    }

    resolveTenant()
    return () => { mounted = false }
  }, [])

  return tenantId
}
