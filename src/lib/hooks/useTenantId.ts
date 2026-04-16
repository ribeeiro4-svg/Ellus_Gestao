'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useTenantId() {
  const [tenantId, setTenantId] = useState<string | null>(null)
  
  useEffect(() => {
    const sb = createClient()
    
    // Tenta obter o usuário logado
    sb.auth.getUser().then(({ data }) => {
      if (data.user) {
        // Se logado, busca o tenant_id vinculado na tabela de usuários
        // Adicionamos um atraso opcional ou retry se necessário, mas o principal é buscar o dado real
        sb.from('usuarios')
          .select('tenant_id')
          .eq('id', data.user.id)
          .single()
          .then(({ data: u, error }) => { 
            if (u && u.tenant_id) {
              setTenantId(u.tenant_id)
            } else {
              console.warn('Usuário logado mas sem tenant_id vinculado na tabela public.usuarios')
              // Se não encontrar vínculo, não setamos nada para evitar IDs fantasmas
              setTenantId(null)
            }
          })
      } else {
        console.warn('Nenhum usuário logado. O sistema de demonstração por cookies foi desativado para evitar erros de banco.')
        setTenantId(null)
      }
    })
  }, [])

  return tenantId
}
