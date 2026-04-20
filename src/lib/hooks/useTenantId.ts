'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook de Identidade ACPROBEC - VERSÃO DINÂMICA COM FALLBACK DE SEGURANÇA
 * Busca o ID do Tenant Principal mapeado no banco de dados.
 */
export function useTenantId() {
  const [tenantId, setTenantId] = useState<string>('971f92af-a72b-4bc4-a8e0-333d712ce6a7')
  
  useEffect(() => {
    const sb = createClient();
    async function resolveId() {
      try {
        const { data, error } = await sb.from('tenant_id_mapping').select('id').limit(1).single();
        
        if (data?.id) {
          console.log('[TenantId] ID Resolvido via Banco:', data.id);
          setTenantId(data.id);
        } else if (!error) {
          // Mapping retornou vazio sem erro
          setTenantId('971f92af-a72b-4bc4-a8e0-333d712ce6a7');
        } else {
          // Tabela não existe ou outro erro (silencioso em produção para evitar poluição)
          setTenantId('971f92af-a72b-4bc4-a8e0-333d712ce6a7');
        }
      } catch (e) {
        setTenantId('971f92af-a72b-4bc4-a8e0-333d712ce6a7');
      }
    }
    resolveId();
  }, [])

  return tenantId
}
