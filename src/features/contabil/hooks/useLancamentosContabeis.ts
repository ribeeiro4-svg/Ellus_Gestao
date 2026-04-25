import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from '@/lib/hooks/useTenantId'

export interface LancamentoContabil {
  id: string
  numero_lancamento: string
  data_lancamento: string
  data_competencia: string
  tipo: string
  historico: string
  documento_tipo: string
  documento_numero: string
  origem_tipo: string
  status: string
  usuario_nome: string
  created_at: string
  partidas?: Partida[]
}

export interface Partida {
  id: string
  lancamento_id: string
  conta_id: string
  tipo_partida: 'D' | 'C'
  valor: number
  historico_partida: string
  ordem: number
  conta?: { codigo: string; descricao: string; natureza: string }
}

export function useLancamentosContabeis() {
  const tenantId = useTenantId()
  const [lancamentos, setLancamentos] = useState<LancamentoContabil[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, confirmados: 0, estornados: 0 })
  const sb = createClient()

  const fetch = useCallback(async (competencia?: string) => {
    if (!tenantId) return
    setLoading(true)
    
    // 1. Buscar Lista (Aumentado limite para visibilidade)
    let q = sb.from('lancamentos_contabeis').select('*').eq('tenant_id', tenantId).order('data_lancamento', { ascending: false }).limit(1000)
    if (competencia) {
      const [ano, mes] = competencia.split('-')
      q = q.gte('data_competencia', `${ano}-${mes}-01`).lte('data_competencia', `${ano}-${mes}-31`)
    }
    const { data } = await q
    setLancamentos(data ?? [])

    // 2. Buscar Estatísticas Reais (Sem Limite)
    const { count: total } = await sb.from('lancamentos_contabeis').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)
    const { count: confirmados } = await sb.from('lancamentos_contabeis').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'confirmado')
    const { count: estornados } = await sb.from('lancamentos_contabeis').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'estornado')

    setStats({ 
      total: total || 0, 
      confirmados: confirmados || 0, 
      estornados: estornados || 0 
    })
    
    setLoading(false)
  }, [tenantId])

  useEffect(() => { fetch() }, [fetch])

  const buscarPartidas = async (lancamentoId: string): Promise<Partida[]> => {
    const { data } = await sb.from('lancamentos_partidas')
      .select('*, conta:conta_id(codigo, descricao, natureza)')
      .eq('lancamento_id', lancamentoId)
      .order('ordem')
    return data ?? []
  }

  const inserir = async (dados: {
    data: string
    historico: string
    tipo?: string
    documentoTipo?: string
    documentoNumero?: string
    origemTipo?: string
    origemId?: string
    partidas: { contaId: string; tipo: 'D' | 'C'; valor: number; historico?: string }[]
  }) => {
    if (!tenantId) return { error: 'Tenant não identificado' }

    // Validar partidas balanceadas
    const totalD = dados.partidas.filter(p => p.tipo === 'D').reduce((s, p) => s + p.valor, 0)
    const totalC = dados.partidas.filter(p => p.tipo === 'C').reduce((s, p) => s + p.valor, 0)
    if (Math.abs(totalD - totalC) > 0.01) return { error: `Lançamento não balanceado: Débitos R$ ${totalD.toFixed(2)} ≠ Créditos R$ ${totalC.toFixed(2)}` }

    // Número sequencial
    const { count } = await sb.from('lancamentos_contabeis').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId)
    const seq = ((count || 0) + 1).toString().padStart(6, '0')
    const ano = dados.data.slice(0, 4)
    const numero = `${ano}/${seq}`

    const { data: lanc, error: lancError } = await sb.from('lancamentos_contabeis').insert({
      tenant_id: tenantId,
      numero_lancamento: numero,
      data_lancamento: dados.data,
      data_competencia: dados.data,
      tipo: dados.tipo || 'normal',
      historico: dados.historico,
      documento_tipo: dados.documentoTipo || null,
      documento_numero: dados.documentoNumero || null,
      origem_tipo: dados.origemTipo || null,
      origem_id: dados.origemId || null,
      status: 'confirmado',
    }).select().single()

    if (lancError) return { error: lancError.message }

    const partidas = dados.partidas.map((p, i) => ({
      lancamento_id: lanc.id,
      conta_id: p.contaId,
      tipo_partida: p.tipo,
      valor: p.valor,
      historico_partida: p.historico || dados.historico,
      ordem: i + 1,
    }))

    const { error: partError } = await sb.from('lancamentos_partidas').insert(partidas)
    if (partError) return { error: partError.message }

    fetch()
    return { error: null, id: lanc.id, numero }
  }

  const estornar = async (id: string) => {
    const original = lancamentos.find(l => l.id === id)
    if (!original) return { error: 'Lançamento não encontrado' }
    const partidas = await buscarPartidas(id)
    const invertidas = partidas.map(p => ({
      contaId: p.conta_id,
      tipo: (p.tipo_partida === 'D' ? 'C' : 'D') as 'D' | 'C',
      valor: p.valor,
      historico: `ESTORNO — ${p.historico_partida || original.historico}`,
    }))
    const r = await inserir({
      data: new Date().toISOString().split('T')[0],
      historico: `ESTORNO — ${original.historico} (Ref: ${original.numero_lancamento})`,
      tipo: 'estorno',
      partidas: invertidas,
    })
    if (!r.error) {
      await sb.from('lancamentos_contabeis').update({ status: 'estornado', estorno_do_id: id }).eq('id', id)
      fetch()
    }
    return r
  }

  const excluir = async (id: string, senha: string) => {
    if (senha !== '19072425') return { error: 'Senha de exclusão incorreta.' }
    const original = lancamentos.find(l => l.id === id)
    if (!original) return { error: 'Lançamento não encontrado' }

    // Excluir as partidas (caso não haja ON DELETE CASCADE configurado)
    const { error: partErr } = await sb.from('lancamentos_partidas').delete().eq('lancamento_id', id)
    if (partErr) return { error: partErr.message }

    const { error: lancErr } = await sb.from('lancamentos_contabeis').delete().eq('id', id)
    if (lancErr) return { error: lancErr.message }

    fetch()
    return { error: null }
  }

  // Balancete de verificação por período
  const calcularBalancete = async (periodo: string) => {
    let start, end;
    if (periodo.includes('-')) {
      const [ano, mes] = periodo.split('-')
      start = `${ano}-${mes}-01`
      end = `${ano}-${mes}-31`
    } else {
      start = `${periodo}-01-01`
      end = `${periodo}-12-31`
    }

    const { data: partidas } = await sb.from('lancamentos_partidas')
      .select('conta_id, tipo_partida, valor, lancamento:lancamento_id(data_competencia, status, tenant_id)')
      .eq('lancamento.tenant_id', tenantId)
      .eq('lancamento.status', 'confirmado')
      .gte('lancamento.data_competencia', start)
      .lte('lancamento.data_competencia', end)

    const saldos: Record<string, { debitos: number; creditos: number }> = {}
    ;(partidas ?? []).forEach((p: any) => {
      if (!saldos[p.conta_id]) saldos[p.conta_id] = { debitos: 0, creditos: 0 }
      if (p.tipo_partida === 'D') saldos[p.conta_id].debitos += Number(p.valor)
      else saldos[p.conta_id].creditos += Number(p.valor)
    })

    return saldos
  }

  return { lancamentos, loading, stats, inserir, estornar, excluir, buscarPartidas, calcularBalancete, refresh: fetch }
}
