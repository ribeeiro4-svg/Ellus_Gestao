'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from '@/lib/hooks/useTenantId'
import type { Tarefa, TarefaComentario } from '@/lib/types'

export function useTarefas() {
  const tenantId = useTenantId()
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const { data: tarefasData, error: tErr } = await sb.from('tarefas')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
      
      if (tErr) throw tErr

      const nameMap: Record<string, string> = {}
      try {
        const [ { data: users }, { data: dirs }, { data: assocs } ] = await Promise.all([
          sb.from('usuarios').select('id, nome').eq('tenant_id', tenantId),
          sb.from('diretoria').select('id, nome').eq('tenant_id', tenantId),
          sb.from('associados').select('id, nome').eq('tenant_id', tenantId)
        ])
        users?.forEach(u => nameMap[u.id] = u.nome)
        dirs?.forEach(d => nameMap[d.id] = d.nome)
        assocs?.forEach(a => nameMap[a.id] = a.nome)
      } catch (e) {}
      
      const formatted = (tarefasData || []).map((t: any) => ({
        ...t,
        responsavel_nome: nameMap[t.responsavel_id] || 'Sem responsável',
        associado_nome: t.associado_id ? (nameMap[t.associado_id] || `ID: ${t.associado_id.substring(0,8)}`) : null
      }))
      
      setTarefas(formatted)
    } catch (err) {
      console.error('Erro useTarefas:', err)
    } finally {
      setLoading(false)
    }
  }, [tenantId, sb])

  useEffect(() => { fetch() }, [fetch])

  const salvar = async (id: string | undefined, input: any) => {
    const payload: any = {
      titulo: input.titulo,
      descricao: input.descricao,
      responsavel_id: input.responsavel_id,
      associado_id: (input.associado_id === '' || input.associado_id === 'none') ? null : input.associado_id,
      status: input.status,
      prioridade: input.prioridade,
      categoria: input.categoria,
      prazo: input.prazo,
      tenant_id: tenantId
    }

    if (id) {
      const { error } = await sb.from('tarefas').update(payload).eq('id', id)
      if (!error) await fetch()
      return { error }
    } else {
      const { data: userData } = await sb.auth.getUser()
      const { error } = await sb.from('tarefas').insert({ ...payload, criado_por: userData.user?.id })
      if (!error) await fetch()
      return { error }
    }
  }

  const buscarComentarios = async (tarefaId: string) => {
    const { data, error } = await sb.from('tarefa_comentarios')
      .select('*')
      .eq('tarefa_id', tarefaId)
      .order('created_at', { ascending: true })
    
    if (error) return []

    // Buscar nomes dos autores de forma eficiente
    const autorIds = Array.from(new Set(data.map(c => c.autor_id).filter(Boolean)))
    const nameMap: Record<string, string> = {}
    
    if (autorIds.length > 0) {
      const [{ data: uNames }, { data: dNames }] = await Promise.all([
        sb.from('usuarios').select('id, nome').in('id', autorIds),
        sb.from('diretoria').select('id, nome').in('id', autorIds)
      ])
      uNames?.forEach(u => nameMap[u.id] = u.nome)
      dNames?.forEach(d => nameMap[d.id] = d.nome)
    }

    return data.map((c: any) => ({ 
      ...c, 
      autor_nome: nameMap[c.autor_id] || 'Sistema' 
    }))
  }

  const adicionarComentario = async (tarefaId: string, texto: string) => {
    const { data: userData } = await sb.auth.getUser()
    const { error } = await sb.from('tarefa_comentarios').insert({
      tarefa_id: tarefaId,
      tenant_id: tenantId,
      autor_id: userData.user?.id,
      texto
    })
    return { error }
  }

  const editarComentario = async (comentarioId: string, texto: string) => {
    const { error } = await sb.from('tarefa_comentarios')
      .update({ texto })
      .eq('id', comentarioId)
    return { error }
  }

  const excluirComentario = async (comentarioId: string) => {
    const { error } = await sb.from('tarefa_comentarios')
      .delete()
      .eq('id', comentarioId)
    return { error }
  }

  return { 
    tarefas, 
    loading, 
    inserir: (data: any) => salvar(undefined, data), 
    atualizar: (id: string, data: any) => salvar(id, data), 
    remover: (id: string) => sb.from('tarefas').delete().eq('id', id).then(r => { fetch(); return r; }), 
    refresh: fetch,
    buscarComentarios,
    adicionarComentario,
    editarComentario,
    excluirComentario
  }
}
