'use client'
import { useEffect, useState } from 'react'
import { getMyTenantIdAction } from '@/app/actions/tenantActions'

/**
 * Hook de Identidade ACPROBEC - VERSÃO DEFINITIVA (SERVER-SIDE BYPASS)
 * Resolve o Tenant ID no servidor para evitar erros 406 no cliente.
 */
export function useTenantId(): string {
  // ACPROBEC - Associação Colaborativa (ID correto com os 2420 lançamentos)
  const FALLBACK = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  
  const [tenantId, setTenantId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('acprobec_tenant_id')
      // Se tiver o ID da Matriz antigo, ignorar e usar o correto
      if (saved === '15782181-31a9-4d9a-9cde-315cf84aec5a') return FALLBACK
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
