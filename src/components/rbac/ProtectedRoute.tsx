'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRBAC } from '@/lib/contexts/RBACContext'
import type { Permission } from '@/lib/rbac/permissions'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  /** Permissão necessária para acessar esta página */
  permission: Permission
  children: React.ReactNode
}

/**
 * Guard de rota — envolve uma página e redireciona para /acesso-negado
 * caso o usuário não tenha a permissão exigida.
 *
 * @example
 * export default function ConfiguracoesPage() {
 *   return (
 *     <ProtectedRoute permission="configuracoes:view">
 *       <ConteudoDaPagina />
 *     </ProtectedRoute>
 *   )
 * }
 */
export default function ProtectedRoute({ permission, children }: ProtectedRouteProps) {
  const { can, loading, profileMissing } = useRBAC()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (profileMissing) {
      router.replace('/acesso-negado?reason=no-profile')
      return
    }
    if (!can(permission)) {
      router.replace('/acesso-negado')
    }
  }, [loading, profileMissing, can, permission, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    )
  }

  if (profileMissing || !can(permission)) return null

  return <>{children}</>
}
