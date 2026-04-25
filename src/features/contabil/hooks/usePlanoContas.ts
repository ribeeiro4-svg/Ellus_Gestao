import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from '@/lib/hooks/useTenantId'
import { PLANO_CONTAS_ITG2002 } from '@/features/contabil/data/planoContasITG2002'

export interface ContaCodigo {
  id: string
  codigo: string
  descricao: string
  nivel: number
  tipo: string
  natureza: string
  classificacao: string
  aceita_lancamentos: boolean
  ativa: boolean
  conta_pai_id: string | null
}

export function usePlanoContas(): {
  tenantId: string
  contas: ContaCodigo[]
  loading: boolean
  contasAnaliticas: ContaCodigo[]
  porClassificacao: {
    ativo: ContaCodigo[]
    passivo: ContaCodigo[]
    patrimonio_social: ContaCodigo[]
    ingresso: ContaCodigo[]
    despesa: ContaCodigo[]
  }
  inicializarPlanoContas: () => Promise<{ error: string | null }>
  adicionarConta: (data: Omit<ContaCodigo, 'id'>) => Promise<{ error: any }>
  editarConta: (id: string, data: Partial<ContaCodigo>) => Promise<{ error: any }>
  desativarConta: (id: string) => Promise<{ error: any }>
  refresh: () => Promise<void>
} {
  const tenantId = useTenantId()
  const [contas, setContas] = useState<ContaCodigo[]>([])
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    const { data } = await sb.from('plano_contas').select('*').eq('tenant_id', tenantId).eq('ativa', true).order('codigo')
    setContas(data ?? [])
    setLoading(false)
  }, [tenantId])

  useEffect(() => { fetch() }, [fetch])

  const inicializarPlanoContas = async () => {
    if (!tenantId) return { error: 'Tenant não identificado' }
    // Verificar se já existe
    const { data: existing } = await sb.from('plano_contas').select('id').eq('tenant_id', tenantId).limit(1)
    if (existing && existing.length > 0) return { error: 'Plano de contas já inicializado' }

    // Inserir em níveis para respeitar FK da conta_pai
    const rows = PLANO_CONTAS_ITG2002.map(c => ({
      tenant_id: tenantId,
      codigo: c.codigo,
      descricao: c.descricao,
      nivel: c.nivel,
      tipo: c.tipo,
      natureza: c.natureza,
      classificacao: c.classificacao,
      aceita_lancamentos: (c as any).aceita_lancamentos ?? false,
      ativa: true,
    }))

    const { error } = await sb.from('plano_contas').insert(rows)
    if (!error) {
      // Atualizar conta_pai_id
      const { data: inserted } = await sb.from('plano_contas').select('id, codigo').eq('tenant_id', tenantId)
      if (inserted) {
        for (const conta of inserted) {
          const partes = conta.codigo.split('.')
          if (partes.length > 1) {
            const paiCodigo = partes.slice(0, -1).join('.')
            const pai = inserted.find(c => c.codigo === paiCodigo)
            if (pai) {
              await sb.from('plano_contas').update({ conta_pai_id: pai.id }).eq('id', conta.id)
            }
          }
        }
      }
      fetch()
    }
    return { error: error?.message ?? null }
  }

  const adicionarConta = async (data: Omit<ContaCodigo, 'id'>) => {
    const { error } = await sb.from('plano_contas').insert({ ...data, tenant_id: tenantId })
    if (!error) fetch()
    return { error }
  }

  const editarConta = async (id: string, data: Partial<ContaCodigo>) => {
    const { error } = await sb.from('plano_contas').update(data).eq('id', id)
    if (!error) fetch()
    return { error }
  }

  const desativarConta = async (id: string) => {
    const { error } = await sb.from('plano_contas').update({ ativa: false }).eq('id', id)
    if (!error) fetch()
    return { error }
  }

  // Contas analiticas para seleção em lançamentos
  const contasAnaliticas = contas.filter(c => c.tipo === 'analitica' && c.aceita_lancamentos)

  // Agrupadas por classificação para relatórios
  const porClassificacao = {
    ativo: contas.filter(c => c.classificacao === 'ativo'),
    passivo: contas.filter(c => c.classificacao === 'passivo'),
    patrimonio_social: contas.filter(c => c.classificacao === 'patrimonio_social'),
    ingresso: contas.filter(c => c.classificacao === 'ingresso'),
    despesa: contas.filter(c => c.classificacao === 'despesa'),
  }

  return { tenantId, contas, loading, contasAnaliticas, porClassificacao, inicializarPlanoContas, adicionarConta, editarConta, desativarConta, refresh: fetch }
}
