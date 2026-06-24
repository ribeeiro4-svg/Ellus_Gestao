import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from '@/lib/hooks/useTenantId'
import { MESES } from '@/lib/utils/formatters'

export function useFichaAssociado(associadoId: string | null) {
  const tenantId = useTenantId()
  const sb = createClient()
  const [loading, setLoading] = useState(false)
  const [associado, setAssociado] = useState<any>(null)
  const [extrato, setExtrato] = useState<any[]>([])
  const [atendimentos, setAtendimentos] = useState<any[]>([])
  const [historicoCobrancas, setHistoricoCobrancas] = useState<any[]>([])

  const carregarDados = useCallback(async () => {
    if (!associadoId || !tenantId) return
    setLoading(true)
    try {
      // 1. Buscar Dados Cadastrais
      const { data: assocData } = await sb.from('associados')
        .select('*')
        .eq('id', associadoId)
        .single()
      
      setAssociado(assocData)

      // 2. Buscar Extrato do Ano Corrente
      const anoCorrente = new Date().getFullYear()
      const { data: lancs } = await sb.from('lancamentos')
        .select('*')
        .eq('associado_id', associadoId)
        .eq('tenant_id', tenantId)
        .gte('data', `${anoCorrente}-01-01`)
        .lte('data', `${anoCorrente}-12-31`)
      
      // Processar os 12 meses
      const gradeMeses = MESES.map((nome, idx) => {
        const matches = (lancs || []).filter((l: any) => {
          const d = new Date(l.data + 'T12:00:00Z')
          const compMes = l.competencia_mes != null && l.competencia_mes !== '' ? Number(l.competencia_mes) : d.getUTCMonth()
          return compMes === idx
        })

        const lanc = matches.find((l: any) => l.status === 'pago') || matches[0]
        
        let status = 'vazio'
        if (lanc) {
          const isAdesao = lanc.categoria?.toUpperCase().includes('ADESÃO') || lanc.descricao?.toUpperCase().includes('ADESÃO')
          if (isAdesao) {
            status = lanc.status === 'pago' ? 'adesao_paga' : 'adesao'
          }
          else if (lanc.status === 'pago') status = 'pago'
          else if (lanc.status === 'aberto' || lanc.status === 'atrasado') {
            const dataVenc = new Date(lanc.data + 'T12:00:00Z')
            const hoje = new Date()
            hoje.setHours(0, 0, 0, 0)
            if (dataVenc >= hoje) status = 'a_vencer'
            else status = 'pendente'
          }
        } else {
          const mesAtual = new Date().getMonth()
          if (idx > mesAtual) status = 'futuro'
          else status = 'nao_cobrado'
        }

        return {
          mes: nome,
          valor: lanc?.valor || assocData?.mensalidade || 0,
          status,
          lancamento: lanc
        }
      })

      setExtrato(gradeMeses)

      // 3. Buscar Histórico de Atendimentos
      const { data: atendData } = await sb.from('atendimentos')
        .select('*, responsaveis_atendimento(nome)')
        .eq('associado_id', associadoId)
        .eq('tenant_id', tenantId)
        .order('data_agendamento', { ascending: false })

      // 4. Buscar Ações de Cobrança
      const { data: cobrancaData } = await sb.from('cobranca_acoes')
        .select('*')
        .eq('associado_id', associadoId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      // 5. Mesclar e ordenar apenas os atendimentos normais
      const mergedAtendimentos = (atendData || []).map(a => ({
           ...a,
           is_cobranca: false,
           _date: new Date(a.data_agendamento || a.created_at || 0).getTime()
      })).sort((a, b) => b._date - a._date)

      setAtendimentos(mergedAtendimentos)
      
      const parsedCobrancas = (cobrancaData || []).map(c => ({
           ...c,
           id: `cob_${c.id}`,
           is_cobranca: true,
           data_agendamento: c.created_at,
           responsavel_setor: c.canal || 'Sistema',
           status: 'concluido',
           etapas_concluidas: { observacao: `${c.etapa}: ${c.observacao || c.texto_enviado || ''}` },
           _date: new Date(c.created_at || 0).getTime()
      }))
      
      setHistoricoCobrancas(parsedCobrancas)
    } catch (err) {
      console.error('Erro ao carregar ficha do associado:', err)
    } finally {
      setLoading(false)
    }
  }, [associadoId, tenantId, sb])

  useEffect(() => {
    if (associadoId) carregarDados()
    else {
      setAssociado(null)
      setExtrato([])
      setAtendimentos([])
      setHistoricoCobrancas([])
    }
  }, [associadoId, carregarDados])

  return { associado, extrato, atendimentos, historicoCobrancas, loading, refresh: carregarDados }
}
