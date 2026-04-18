'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook de Identidade ACPROBEC - VERSÃO DINÂMICA
 * Busca o ID do Tenant Principal mapeado no banco de dados.
 */
export function useTenantId() {
  const [tenantId, setTenantId] = useState<string>('971f92af-a72b-4bc4-a8e0-333d712ce6a7')
  
  useEffect(() => {
    const sb = createClient();
    async function resolveId() {
      try {
        const { data } = await sb.from('tenant_id_mapping').select('id').limit(1).single();
        if (data?.id) {
          console.log('[TenantId] ID Resolvido via Banco:', data.id);
          setTenantId(data.id);
        }
      } catch (e) {
        console.warn('[TenantId] Usando ID reserva (acesso publico)');
      }
    }
    resolveId();
  }, [])

  return tenantId
}
