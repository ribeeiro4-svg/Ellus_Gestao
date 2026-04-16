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
          .then(({ data: u, error }) => { 
            if (u) setTenantId(u.tenant_id)
            else {
              console.warn('User found in Auth but not in public.usuarios table or no tenant assigned.')
              // Optional: set a default tenant or leave as null but we must trigger a state change to wake up other hooks
              // For now, if not found, we don't have a reliable way to solve it without data.
            }
          })
      } else {
        console.warn('No active session found in useTenantId.')
      }
    })
  }, [])

  return tenantId
}
