import { useCallback } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useColaboradores() {
  const { data, isLoading, mutate } = useSWR('/api/colaboradores', fetcher, { revalidateOnFocus: true })
  
  const colaboradores = data || []
  const loading = isLoading

  const fetchColaboradores = useCallback(async () => {
    await mutate()
  }, [mutate])

  const inserir = async (dados: any) => {
    const res = await fetch('/api/colaboradores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    })
    const data = await res.json()
    if (res.ok) await mutate()
    return { data: res.ok ? data : null, error: res.ok ? null : data.erro }
  }

  const atualizar = async (id: string, dados: any) => {
    const res = await fetch(`/api/colaboradores/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    })
    const data = await res.json()
    if (res.ok) await mutate()
    return { data: res.ok ? data : null, error: res.ok ? null : data.erro }
  }

  const alterarStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/colaboradores/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    const data = await res.json()
    if (res.ok) await mutate()
    return { data: res.ok ? data : null, error: res.ok ? null : data.erro }
  }

  return { colaboradores, loading, inserir, atualizar, alterarStatus, refresh: fetchColaboradores }
}

export function usePerfis() {
  const { data, isLoading, mutate } = useSWR('/api/perfis', fetcher, { revalidateOnFocus: true })
  
  const perfis = data || []
  const loading = isLoading

  const fetchPerfis = useCallback(async () => {
    await mutate()
  }, [mutate])

  const atualizarPermissoes = async (id: string, permissoes: any[]) => {
    const res = await fetch(`/api/perfis/${id}/permissoes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissoes })
    })
    const data = await res.json()
    if (res.ok) await mutate()
    return { data: res.ok ? data : null, error: res.ok ? null : data.erro }
  }

  const excluir = async (id: string) => {
    const res = await fetch(`/api/perfis/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) await mutate()
    return { data: res.ok ? data : null, error: res.ok ? null : data.erro }
  }

  const editar = async (id: string, dados: { nome: string; descricao: string }) => {
    const res = await fetch(`/api/perfis/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    })
    const data = await res.json()
    if (res.ok) await mutate()
    return { data: res.ok ? data : null, error: res.ok ? null : data.erro }
  }

  return { perfis, loading, atualizarPermissoes, excluir, editar, refresh: fetchPerfis }
}
