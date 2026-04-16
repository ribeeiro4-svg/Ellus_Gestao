'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
        // Modo Demonstração com Persistência em Banco (Sandbox)
        let gid = typeof window !== 'undefined' ? localStorage.getItem('acprobec_guest_id') : null
        if (!gid) {
          gid = typeof self !== 'undefined' && self.crypto?.randomUUID ? self.crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
          if (typeof window !== 'undefined') localStorage.setItem('acprobec_guest_id', gid)
        }
        setTenantId(gid)
      }
    })
  }, [])

  return tenantId
}

