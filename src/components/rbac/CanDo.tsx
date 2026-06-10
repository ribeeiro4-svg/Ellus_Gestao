'use client'
import React from 'react'
import { useRBAC } from '@/lib/contexts/RBACContext'
import type { Permission } from '@/lib/rbac/permissions'

interface CanDoProps {
  /** Permissão necessária para renderizar os filhos */
  action: Permission
  /** Conteúdo alternativo quando sem permissão (opcional) */
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Componente guard de ação — renderiza filhos apenas se o usuário
 * tiver a permissão solicitada.
 *
 * @example
 * <CanDo action="financeiro:write">
 *   <button>Novo Lançamento</button>
 * </CanDo>
 *
 * @example com fallback
 * <CanDo action="configuracoes:write" fallback={<span>Sem permissão</span>}>
 *   <button>Salvar</button>
 * </CanDo>
 */
export default function CanDo({ action, fallback = null, children }: CanDoProps) {
  const { can } = useRBAC()
  if (!can(action)) return <>{fallback}</>
  return <>{children}</>
}
