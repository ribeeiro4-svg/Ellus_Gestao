'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook de Identidade ACPROBEC - VERSÃO DINÂMICA
 * Busca o ID do Tenant do usuário logado ou usa o fallback padrão.
 */
export function useTenantId(): string {
  const FALLBACK = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  
  // 1. Tenta carregar do localStorage imediatamente para evitar estados null
  const [tenantId, setTenantId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('acprobec_tenant_id')
      if (saved && saved.length > 20) return saved
    }
    return FALLBACK
  })
  
  useEffect(() => {
    const sb = createClient();
    let mounted = true;
    
    async function resolveTenant() {
      // Tenta até 3 vezes com pequenos intervalos em caso de erro 406 transiente
      for (let attempt = 0; attempt < 3; attempt++) {
        if (!mounted) return;

        const { data: { user } } = await sb.auth.getUser()
        if (user) {
          // 1. JWT Metadata (Mais rápido)
          const metaTenant = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
          if (metaTenant) {
            if (mounted) {
              setTenantId(metaTenant)
              localStorage.setItem('acprobec_tenant_id', metaTenant)
            }
            return
          }

          // 2. Database Fallback
          const { data: userData, error } = await sb.from('usuarios').select('tenant_id').eq('id', user.id).maybeSingle()
          if (!error && userData?.tenant_id) {
            if (mounted) {
              setTenantId(userData.tenant_id)
              localStorage.setItem('acprobec_tenant_id', userData.tenant_id)
            }
            return
          }
        }
        
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    resolveTenant()
    return () => { mounted = false }
  }, [])

  return tenantId
}
