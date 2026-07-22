'use client'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'

export interface CalendarioNota {
  id: string
  tipo: 'observacao' | 'alerta' | 'pendencia'
  texto: string
  resolvido?: boolean
  criado_por?: string
  criado_em?: string
}

export interface DiaCalendario {
  data: string
  primeira_conciliacao_em: string | null
  conciliado_por_nome?: string | null
  conciliado_por_email?: string | null
  periodo_conciliado?: string | null
  teve_transacoes?: boolean | null
  notas: CalendarioNota[]
}

export function useConciliacaoCalendario() {
  const tenantId = useTenantId()
  const sb = createClient()
  const [dias, setDias] = useState<DiaCalendario[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDias = useCallback(async (contaId: string, ano: number, mes?: number) => {
    if (!tenantId || !contaId) return

    setLoading(true)
    try {
      let query = sb.from('conciliacao_calendario_dias')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('conta_id', contaId)

      if (mes) {
        const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`
        const endDate = new Date(ano, mes, 0).toISOString().split('T')[0]
        query = query.gte('data', startDate).lte('data', endDate)
      } else {
        const startDate = `${ano}-01-01`
        const endDate = `${ano}-12-31`
        query = query.gte('data', startDate).lte('data', endDate)
      }

      const { data, error } = await query

      if (error) throw error

      setDias(data || [])
    } catch (err) {
      console.error('Erro ao buscar calendário:', err)
    } finally {
      setLoading(false)
    }
  }, [tenantId, sb])

  const registrarDiasConciliados = async (contaId: string, diasParaRegistrar: { data: string, teve_transacao: boolean }[], usuarioNome?: string, usuarioEmail?: string, periodo?: string) => {
    if (!tenantId || !contaId || diasParaRegistrar.length === 0) return

    try {
      const datas = diasParaRegistrar.map(d => d.data)
      const { data: existentes } = await sb.from('conciliacao_calendario_dias')
        .select('data')
        .eq('tenant_id', tenantId)
        .eq('conta_id', contaId)
        .in('data', datas)

      const existentesDatas = new Set(existentes?.map(e => e.data) || [])
      
      const novos = diasParaRegistrar.filter(d => !existentesDatas.has(d.data)).map(d => ({
        tenant_id: tenantId,
        conta_id: contaId,
        data: d.data,
        primeira_conciliacao_em: new Date().toISOString(),
        conciliado_por_nome: usuarioNome || null,
        conciliado_por_email: usuarioEmail || null,
        periodo_conciliado: periodo || null,
        teve_transacoes: d.teve_transacao
      }))

      if (novos.length > 0) {
        const { error } = await sb.from('conciliacao_calendario_dias').insert(novos)
        if (error) console.error('Erro ao registrar dias conciliados:', error)
      }

    } catch (err) {
      console.error('Erro geral ao registrar dias:', err)
    }
  }

  const salvarNotas = async (contaId: string, dataStr: string, notas: CalendarioNota[]) => {
    if (!tenantId || !contaId) return

    try {
      const { data: diaExistente } = await sb.from('conciliacao_calendario_dias')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('conta_id', contaId)
        .eq('data', dataStr)
        .single()

      if (diaExistente) {
        await sb.from('conciliacao_calendario_dias')
          .update({ notas: notas, updated_at: new Date().toISOString() })
          .eq('id', diaExistente.id)
      } else {
        await sb.from('conciliacao_calendario_dias').insert({
          tenant_id: tenantId,
          conta_id: contaId,
          data: dataStr,
          notas: notas
        })
      }

      setDias(prev => {
        const exists = prev.find(p => p.data === dataStr)
        if (exists) {
          return prev.map(p => p.data === dataStr ? { ...p, notas } : p)
        }
        return [...prev, { data: dataStr, primeira_conciliacao_em: null, notas }]
      })

    } catch (err) {
      console.error('Erro ao salvar notas:', err)
    }
  }

  return { dias, loading, fetchDias, registrarDiasConciliados, salvarNotas }
}
