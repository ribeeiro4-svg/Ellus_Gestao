import { useState, useEffect } from 'react'

export interface ModulePermissions {
  ver: boolean
  criar: boolean
  editar: boolean
  excluir: boolean
}

export function usePermissions(modulo: string) {
  const [permissions, setPermissions] = useState<ModulePermissions>({
    ver: false,
    criar: false,
    editar: false,
    excluir: false
  })
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const profileRaw = localStorage.getItem('user_profile')
      const permsRaw = localStorage.getItem('user_permissions')

      if (profileRaw) {
        const profile = JSON.parse(profileRaw)
        if (profile.perfil_id === 1) {
          // Admin Master tem acesso a tudo
          setIsAdmin(true)
          setPermissions({
            ver: true,
            criar: true,
            editar: true,
            excluir: true
          })
          setLoading(false)
          return
        }
      }

      if (permsRaw) {
        const allPerms = JSON.parse(permsRaw)
        if (allPerms[modulo]) {
          setPermissions({
            ver: !!allPerms[modulo].ver,
            criar: !!allPerms[modulo].criar,
            editar: !!allPerms[modulo].editar,
            excluir: !!allPerms[modulo].excluir
          })
        }
      }
    } catch (e) {
      console.error('Erro ao ler permissões:', e)
    } finally {
      setLoading(false)
    }
  }, [modulo])

  return { ...permissions, isAdmin, loading }
}
