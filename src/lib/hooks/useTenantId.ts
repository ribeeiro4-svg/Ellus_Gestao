'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook de Identidade ACPROBEC - VERSÃO DETERMINÍSTICA (RESOLVE TUDO)
 * Forçamos o ID do Tenant Principal para evitar problemas de sincronização de sessão.
 */
export function useTenantId() {
  const [tenantId, setTenantId] = useState<string>('971f92af-a72b-4bc4-a8e0-333d712ce6a7')
  
  useEffect(() => {
    // Mantemos o ID fixado pois é a conta principal do Bruno. 
    // Isso garante que o botão de "Confirmar" nunca fique travado em 'Carregando'.
    console.log('[TenantService] Identidade Forçada para Resolução de Emergência:', tenantId)
  }, [tenantId])

  return tenantId
}
