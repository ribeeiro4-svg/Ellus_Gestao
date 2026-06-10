'use client'
import React, { createContext, useContext, useMemo } from 'react'
import { useCurrentUser, type CurrentUser } from '@/lib/hooks/useCurrentUser'
import { roleHasPermission, type Permission, type UserRole } from '@/lib/rbac/permissions'

interface RBACContextValue {
  currentUser: CurrentUser | null
  role: UserRole | null
  loading: boolean
  profileMissing: boolean
  /** Checa se o usuário tem uma permissão específica */
  can: (permission: Permission) => boolean
  /** Checa se o usuário tem qualquer uma das permissões listadas */
  canAny: (...permissions: Permission[]) => boolean
  /** Checa se o usuário tem todas as permissões listadas */
  canAll: (...permissions: Permission[]) => boolean
}

const RBACContext = createContext<RBACContextValue>({
  currentUser: null,
  role: null,
  loading: true,
  profileMissing: false,
  can: () => false,
  canAny: () => false,
  canAll: () => false,
})

export function RBACProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, loading, profileMissing } = useCurrentUser()

  const value = useMemo<RBACContextValue>(() => {
    const role = currentUser?.role ?? null

    const can = (permission: Permission): boolean =>
      roleHasPermission(role, permission)

    const canAny = (...permissions: Permission[]): boolean =>
      permissions.some(p => roleHasPermission(role, p))

    const canAll = (...permissions: Permission[]): boolean =>
      permissions.every(p => roleHasPermission(role, p))

    return { currentUser, role, loading, profileMissing, can, canAny, canAll }
  }, [currentUser, loading, profileMissing])

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>
}

/** Hook principal — use em qualquer componente */
export function useRBAC(): RBACContextValue {
  return useContext(RBACContext)
}
