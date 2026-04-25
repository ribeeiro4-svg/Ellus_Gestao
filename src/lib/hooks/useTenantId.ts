'use client'
import { useEffect, useState } from 'react'
import { getMyTenantIdAction } from '@/app/actions/tenantActions'

/**
 * Hook de Identidade ACPROBEC - VERSÃO DEFINITIVA (SERVER-SIDE BYPASS)
 * Resolve o Tenant ID no servidor para evitar erros 406 no cliente.
 */
export function useTenantId(): string {
  const FALLBACK = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  
  const [tenantId, setTenantId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('acprobec_tenant_id')
      if (saved && saved.length > 20) return saved
    }
    return FALLBACK
  })
  
  useEffect(() => {
    let mounted = true;
    
    async function resolve() {
      try {
        const id = await getMyTenantIdAction()
        if (mounted && id) {
          setTenantId(id)
          localStorage.setItem('acprobec_tenant_id', id)
        }
      } catch (err) {
        console.error('Falha ao resolver tenant no servidor:', err)
      }
    }

    resolve()
    return () => { mounted = false }
  }, [])

  return tenantId
}
