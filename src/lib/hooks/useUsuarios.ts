import { useCallback } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import type { Usuario } from '@/lib/types'

export function useUsuarios() {
  const tenantId = useTenantId()
  const sb = createClient()

  const { data, isLoading, mutate } = useSWR<Usuario[]>(
    tenantId ? ['usuarios_data', tenantId] : null,
    async () => {
      const { data: users, error } = await sb.from('usuarios')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('nome')
      if (error) throw error
      return users as Usuario[]
    },
    { revalidateOnFocus: true }
  )

  const usuarios = data || []
  const loading = isLoading

  const fetchUsers = useCallback(async () => {
    await mutate()
  }, [mutate])
  return { usuarios, loading, refresh: fetchUsers }
}
