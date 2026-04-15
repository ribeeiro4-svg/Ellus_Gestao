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
          .then(({ data: u }) => { if (u) setTenantId(u.tenant_id) })
      }
    })
  }, [])

  return tenantId
}
