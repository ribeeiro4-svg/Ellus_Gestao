'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useTenantId() {
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  
  useEffect(() => {
    const sb = createClient()
    
    async function resolveTenant() {
      try {
        console.log('[TenantService] Iniciando resolução de conta...')
        const { data: { user } } = await sb.auth.getUser()
        
        if (user) {
          console.log('[TenantService] Usuário logado:', user.email)
          const { data: u, error } = await sb.from('usuarios')
            .select('tenant_id')
            .eq('id', user.id)
            .single()
          
          if (error) {
            console.error('[TenantService] Erro ao buscar vínculo na tabela usuarios:', error.message)
            setTenantId(null)
          } else if (u && u.tenant_id) {
            console.log('[TenantService] Conta identificada:', u.tenant_id)
            setTenantId(u.tenant_id)
          } else {
            console.warn('[TenantService] Usuário sem tenant_id no banco.')
            setTenantId(null)
          }
        } else {
          console.warn('[TenantService] Nenhum usuário autenticado encontrado.')
          setTenantId(null)
        }
      } catch (err) {
        console.error('[TenantService] Erro crítico na resolução:', err)
        setTenantId(null)
      } finally {
        setIsLoaded(true)
      }
    }

    resolveTenant()
  }, [])

  // Se não carregou ainda, retornamos undefined para a UI saber a diferença entre "Carregando" e "Não encontrado (null)"
  if (!isLoaded) return 'LOADING'
  return tenantId
}
