'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCookie, setCookie } from '@/lib/utils/formatters'

export function useTenantId() {
  const [tenantId, setTenantId] = useState<string | null>(null)
  
  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data }) => {
      if (data.user) {
        sb.from('usuarios').select('tenant_id').eq('id', data.user.id).single()
          .then(({ data: u }) => { 
            if (u) setTenantId(u.tenant_id)
          })
      } else {
        // Modo Demonstração com Identidade via Cookie (Substituindo LocalStorage)
        let gid = getCookie('acprobec_tenant_id')
        
        if (!gid) {
          gid = typeof self !== 'undefined' && self.crypto?.randomUUID 
            ? self.crypto.randomUUID() 
            : Math.random().toString(36).substring(2, 15)
          setCookie('acprobec_tenant_id', gid)
        }
        setTenantId(gid)
      }
    })
  }, [])

  return tenantId
}
