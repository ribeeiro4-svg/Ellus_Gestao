'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import type { UserRole } from '@/lib/rbac/permissions'

export interface CurrentUser {
  authId: string
  email: string
  nome: string
  role: UserRole
  tenantId: string
}

export function useCurrentUser() {
  const tenantId = useTenantId()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileMissing, setProfileMissing] = useState(false)
  const sb = createClient()

  const fetchProfile = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) {
        setCurrentUser(null)
        setLoading(false)
        return
      }

      // Busca o perfil na tabela user_profiles pelo auth.uid()
      const { data: profile, error } = await sb
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId)
        .single()

      if (error || !profile) {
        // Perfil não cadastrado ainda — admin precisa configurar
        setProfileMissing(true)
        setCurrentUser(null)
      } else {
        setProfileMissing(false)
        setCurrentUser({
          authId: user.id,
          email: user.email || '',
          nome: profile.nome || user.email || 'Usuário',
          role: profile.role as UserRole,
          tenantId: profile.tenant_id,
        })
      }
    } catch (err) {
      console.error('Erro ao buscar perfil do usuário:', err)
      setCurrentUser(null)
    } finally {
      setLoading(false)
    }
  }, [tenantId, sb])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  return { currentUser, loading, profileMissing, refresh: fetchProfile }
}
