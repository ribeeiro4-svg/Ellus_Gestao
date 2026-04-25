'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook de Identidade ACPROBEC - VERSÃO DINÂMICA
 * Busca o ID do Tenant do usuário logado ou usa o fallback padrão.
 */
export function useTenantId() {
  const [tenantId, setTenantId] = useState<string>('971f92af-a72b-4bc4-a8e0-333d712ce6a7')
  
  useEffect(() => {
    const sb = createClient();
    
    async function resolveTenant() {
      const { data: { user } } = await sb.auth.getUser()
      if (user) {
        const { data: userData } = await sb.from('usuarios').select('tenant_id').eq('id', user.id).single()
        if (userData?.tenant_id) {
          setTenantId(userData.tenant_id)
        }
      }
    }

    resolveTenant()
  }, [])

  return tenantId
}
