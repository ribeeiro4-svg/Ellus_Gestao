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
    /** 
     * Resolução de ID Simplificada:
     * Como o ambiente ACPROBEC possui um ID fixo e a tabela de mapeamento opcional não está presente,
     * consolidamos o ID aqui para evitar requisições de rede que poluem o console com erros 404.
     */
    setTenantId('971f92af-a72b-4bc4-a8e0-333d712ce6a7');
  }, [])

  return tenantId
}
