'use client'
import { useMemo } from 'react'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useDiretoria } from '@/lib/hooks/useDiretoria'
import { useMetas } from '@/lib/hooks/useMetas'

export type NotificationPriority = 'critico' | 'urgente' | 'alta' | 'media' | 'info'
export type NotificationCategory =
  | 'mensalidade'
  | 'inadimplencia'
  | 'despesa'
  | 'conciliacao'
  | 'associado'
  | 'zapsign'
  | 'presidente'
  | 'estrategia'

export interface Notification {
  id: string
  priority: NotificationPriority
  category: NotificationCategory
  title: string
  description: string
  link?: string
  count?: number
}

const PRIORITY_ORDER: Record<NotificationPriority, number> = {
  critico: 0,
  urgente: 1,
  alta: 2,
  media: 3,
  info: 4,
}

export function useNotifications() {
  const { lancamentos, kpis, loading: loadingFin } = useFinanceiro()
  const { associados, loading: loadingAssoc } = useAssociados()
  const { diretoria } = useDiretoria()
  const { metas } = useMetas()

  const notifications = useMemo<Notification[]>(() => {
    if (loadingFin || loadingAssoc) return []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const in7days = new Date(today)
    in7days.setDate(in7days.getDate() + 7)

    const in30days = new Date(today)
    in30days.setDate(in30days.getDate() + 30)

    const result: Notification[] = []

    // ─── 1. MENSALIDADES ─────────────────────────────────────────────────────
    const receitasAbertas = lancamentos.filter(
      l => l.tipo === 'receita' && (l.status === 'aberto' || l.status === 'atrasado')
    )

    const recHoje = receitasAbertas.filter(l => l.data === todayStr)
    if (recHoje.length > 0) {
      result.push({
        id: 'rec-hoje',
        priority: 'urgente',
        category: 'mensalidade',
        title: `${recHoje.length} mensalidade${recHoje.length > 1 ? 's' : ''} vencem hoje`,
        description: `Total: R$ ${recHoje.reduce((a, l) => a + l.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        link: '/financeiro?tab=receitas&status=aberto',
        count: recHoje.length,
      })
    }

    const rec7dias = receitasAbertas.filter(l => {
      const d = new Date(l.data + 'T00:00:00')
      return d > today && d <= in7days
    })
    if (rec7dias.length > 0) {
      result.push({
        id: 'rec-7dias',
        priority: 'alta',
        category: 'mensalidade',
        title: `${rec7dias.length} mensalidade${rec7dias.length > 1 ? 's' : ''} vencem nos próximos 7 dias`,
        description: `Total: R$ ${rec7dias.reduce((a, l) => a + l.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        link: '/financeiro?tab=receitas&status=aberto',
        count: rec7dias.length,
      })
    }

    const rec30dias = receitasAbertas.filter(l => {
      const d = new Date(l.data + 'T00:00:00')
      return d > in7days && d <= in30days
    })
    if (rec30dias.length > 0) {
      result.push({
        id: 'rec-30dias',
        priority: 'media',
        category: 'mensalidade',
        title: `${rec30dias.length} mensalidade${rec30dias.length > 1 ? 's' : ''} vencem nos próximos 30 dias`,
        description: `Total: R$ ${rec30dias.reduce((a, l) => a + l.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        link: '/financeiro?tab=receitas&status=aberto',
        count: rec30dias.length,
      })
    }

    // ─── 2. INADIMPLÊNCIA ────────────────────────────────────────────────────
    const inadimplentes = associados.filter(a => a.status === 'inadimplente')

    // Agrupar por meses de atraso
    const atraso1 = inadimplentes.filter(a => (a.meses_atraso || 0) === 1)
    const atraso2 = inadimplentes.filter(a => (a.meses_atraso || 0) === 2)
    const atraso3mais = inadimplentes.filter(a => (a.meses_atraso || 0) >= 3)

    if (atraso1.length > 0) {
      result.push({
        id: 'inadimp-1mes',
        priority: 'urgente',
        category: 'inadimplencia',
        title: `${atraso1.length} associado${atraso1.length > 1 ? 's' : ''} com 1 mês de atraso`,
        description: atraso1.slice(0, 3).map(a => a.nome).join(', ') + (atraso1.length > 3 ? '...' : ''),
        link: '/associados?status=inadimplente',
        count: atraso1.length,
      })
    }
    if (atraso2.length > 0) {
      result.push({
        id: 'inadimp-2mes',
        priority: 'urgente',
        category: 'inadimplencia',
        title: `${atraso2.length} associado${atraso2.length > 1 ? 's' : ''} com 2 meses de atraso`,
        description: atraso2.slice(0, 3).map(a => a.nome).join(', ') + (atraso2.length > 3 ? '...' : ''),
        link: '/associados?status=inadimplente',
        count: atraso2.length,
      })
    }
    if (atraso3mais.length > 0) {
      result.push({
        id: 'inadimp-3mais',
        priority: 'critico',
        category: 'inadimplencia',
        title: `${atraso3mais.length} associado${atraso3mais.length > 1 ? 's' : ''} com 3+ meses de atraso`,
        description: atraso3mais.slice(0, 3).map(a => a.nome).join(', ') + (atraso3mais.length > 3 ? '...' : ''),
        link: '/associados?status=inadimplente',
        count: atraso3mais.length,
      })
    }

    // ─── 3. DESPESAS & PAGAMENTOS ─────────────────────────────────────────────
    const despesasAbertas = lancamentos.filter(
      l => l.tipo === 'despesa' && (l.status === 'aberto' || l.status === 'atrasado')
    )

    const despHoje = despesasAbertas.filter(l => l.data === todayStr)
    if (despHoje.length > 0) {
      result.push({
        id: 'desp-hoje',
        priority: 'urgente',
        category: 'despesa',
        title: `${despHoje.length} pagamento${despHoje.length > 1 ? 's' : ''} vencem hoje`,
        description: `Total: R$ ${despHoje.reduce((a, l) => a + l.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        link: '/financeiro?tab=despesas&status=aberto',
        count: despHoje.length,
      })
    }

    const desp7dias = despesasAbertas.filter(l => {
      const d = new Date(l.data + 'T00:00:00')
      return d > today && d <= in7days
    })
    if (desp7dias.length > 0) {
      result.push({
        id: 'desp-7dias',
        priority: 'alta',
        category: 'despesa',
        title: `${desp7dias.length} pagamento${desp7dias.length > 1 ? 's' : ''} vencem nos próximos 7 dias`,
        description: `Total: R$ ${desp7dias.reduce((a, l) => a + l.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        link: '/financeiro?tab=despesas&status=aberto',
        count: desp7dias.length,
      })
    }

    const desp30dias = despesasAbertas.filter(l => {
      const d = new Date(l.data + 'T00:00:00')
      return d > in7days && d <= in30days
    })
    if (desp30dias.length > 0) {
      result.push({
        id: 'desp-30dias',
        priority: 'media',
        category: 'despesa',
        title: `${desp30dias.length} pagamento${desp30dias.length > 1 ? 's' : ''} vencem nos próximos 30 dias`,
        description: `Total: R$ ${desp30dias.reduce((a, l) => a + l.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        link: '/financeiro?tab=despesas&status=aberto',
        count: desp30dias.length,
      })
    }

    // ─── 4. CONCILIAÇÃO BANCÁRIA ─────────────────────────────────────────────
    // Verifica os últimos 7 dias corridos por dias sem nenhum lançamento conciliado
    const diasSemConciliacao: string[] = []
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      // Dia útil (segunda a sexta) sem conciliação
      const dayOfWeek = d.getDay() // 0=Dom, 6=Sab
      if (dayOfWeek === 0 || dayOfWeek === 6) continue
      const conciliadoNoDia = lancamentos.some(l => l.data_conciliacao === ds || (l.conciliado && l.data === ds))
      if (!conciliadoNoDia) {
        diasSemConciliacao.push(ds)
      }
    }

    // Verificar se hoje está sem conciliação
    const conciliadoHoje = lancamentos.some(l => l.data_conciliacao === todayStr || (l.conciliado && l.data === todayStr))
    if (!conciliadoHoje) {
      const dayOfWeekToday = today.getDay()
      if (dayOfWeekToday !== 0 && dayOfWeekToday !== 6) {
        result.push({
          id: 'conc-hoje',
          priority: 'urgente',
          category: 'conciliacao',
          title: 'Conciliação bancária pendente hoje',
          description: 'Nenhum lançamento foi conciliado hoje. Importe o extrato bancário.',
          link: '/financeiro?tab=conciliacao',
        })
      }
    }

    if (diasSemConciliacao.length > 0) {
      result.push({
        id: 'conc-dias',
        priority: 'alta',
        category: 'conciliacao',
        title: `${diasSemConciliacao.length} dia${diasSemConciliacao.length > 1 ? 's úteis' : ' útil'} sem conciliação`,
        description: `Dias pendentes: ${diasSemConciliacao.slice(0, 3).map(d => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')).join(', ')}`,
        link: '/financeiro?tab=conciliacao',
        count: diasSemConciliacao.length,
      })
    }

    // ─── 5. NOVOS ASSOCIADOS SEM LANÇAMENTO ──────────────────────────────────
    const quinzeDiasAtras = new Date(today)
    quinzeDiasAtras.setDate(quinzeDiasAtras.getDate() - 15)
    const quinzeDiasAtrasStr = quinzeDiasAtras.toISOString().split('T')[0]

    const associadosIdsComLancamento = new Set(
      lancamentos.filter(l => l.associado_id).map(l => l.associado_id as string)
    )

    const semLancamento = associados.filter(a => {
      if (!a.created_at) return false
      const createdDate = a.created_at.split('T')[0]
      return (
        createdDate >= quinzeDiasAtrasStr &&
        a.status !== 'inativo' &&
        !associadosIdsComLancamento.has(a.id as string)
      )
    })

    if (semLancamento.length > 0) {
      result.push({
        id: 'assoc-sem-lanc',
        priority: 'alta',
        category: 'associado',
        title: `${semLancamento.length} novo${semLancamento.length > 1 ? 's associados' : ' associado'} sem lançamento`,
        description: semLancamento.slice(0, 3).map(a => a.nome).join(', ') + (semLancamento.length > 3 ? '...' : ''),
        link: '/associados?filter=sem_lancamento',
        count: semLancamento.length,
      })
    }

    // ─── 6. ZAPSIGN — ASSOCIADOS SEM ASSINATURA ──────────────────────────────
    const semAssinatura = associados.filter(a => {
      if (a.status === 'inativo') return false
      if (!a.zapsign_doc_token) return false
      // status pendente indica que o associado ainda não assinou
      if (a.status === 'pendente') return true
      // ou verificar signatários: se tiver zapsign_signers e nenhum com status 'signed'
      if (a.zapsign_signers && Array.isArray(a.zapsign_signers) && a.zapsign_signers.length > 0) {
        return !a.zapsign_signers.some((s: any) => s.status === 'signed' || s.status === 'assinado')
      }
      return false
    })

    if (semAssinatura.length > 0) {
      result.push({
        id: 'zapsign-assoc',
        priority: 'urgente',
        category: 'zapsign',
        title: `${semAssinatura.length} documento${semAssinatura.length > 1 ? 's' : ''} aguardando assinatura do associado`,
        description: semAssinatura.slice(0, 3).map(a => a.nome).join(', ') + (semAssinatura.length > 3 ? '...' : ''),
        link: '/associados?filterTermo=pendente',
        count: semAssinatura.length,
      })
    }

    // ─── 7. ZAPSIGN — DOCUMENTOS PARA O PRESIDENTE ASSINAR ───────────────────
    // Presidente = diretor com cargo contendo 'presidente' (case-insensitive)
    const presidente = diretoria.find(
      d => d.cargo?.toLowerCase().includes('presidente') && d.status === 'ativo'
    )

    if (presidente) {
      // Verificar associados com termo_status pendente para o presidente
      const termoPendente = associados.filter(
        a => a.status !== 'inativo' && a.termo_status && (
          a.termo_status.toLowerCase().includes('pendente') ||
          a.termo_status.toLowerCase().includes('aguardando')
        )
      )
      if (termoPendente.length > 0) {
        result.push({
          id: 'zapsign-presidente',
          priority: 'urgente',
          category: 'presidente',
          title: `${termoPendente.length} documento${termoPendente.length > 1 ? 's' : ''} aguardando assinatura do Presidente`,
          description: termoPendente.slice(0, 3).map(a => a.nome).join(', ') + (termoPendente.length > 3 ? '...' : ''),
          link: '/associados?filterTermo=pendente',
          count: termoPendente.length,
        })
      }
    }

    // ─── 8. ESTRATÉGICAS ──────────────────────────────────────────────────────
    // Resultado do mês negativo
    const resultadoMes = (kpis?.totalRec || 0) - (kpis?.totalDesp || 0)
    if (resultadoMes < 0) {
      result.push({
        id: 'estrat-resultado',
        priority: 'critico',
        category: 'estrategia',
        title: 'Resultado do mês negativo',
        description: `Saldo atual: R$ ${resultadoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Despesas superam as receitas.`,
        link: '/financeiro?tab=geral',
      })
    }

    // Saldo do caixa baixo
    const saldoCaixa = kpis?.saldoCaixa || 0
    if (saldoCaixa >= 0 && saldoCaixa < 500) {
      result.push({
        id: 'estrat-caixa',
        priority: 'alta',
        category: 'estrategia',
        title: 'Saldo do caixa baixo',
        description: `Saldo disponível em caixa: R$ ${saldoCaixa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        link: '/financeiro?tab=geral',
      })
    }

    // Metas abaixo de 80%
    const now = new Date()
    const mesAtual = now.getMonth()
    const anoAtual = now.getFullYear()

    const metasAtivas = metas.filter(m => {
      if (!m.prazo) return false
      const prazo = new Date(m.prazo + 'T00:00:00')
      return prazo.getMonth() === mesAtual && prazo.getFullYear() === anoAtual
    })

    const metasBaixas = metasAtivas.filter(m => {
      const valor_atual = (m as any).valor_atual || 0
      const valor_meta = (m as any).valor_meta || (m as any).valor || 1
      return (valor_atual / valor_meta) < 0.8
    })

    if (metasBaixas.length > 0) {
      result.push({
        id: 'estrat-metas',
        priority: 'media',
        category: 'estrategia',
        title: `${metasBaixas.length} meta${metasBaixas.length > 1 ? 's' : ''} abaixo de 80% neste mês`,
        description: 'Verifique as metas estratégicas e ações de recuperação.',
        link: '/estrategia',
        count: metasBaixas.length,
      })
    }

    // Fechamento pendente (após dia 5 do mês seguinte)
    const diaAtual = now.getDate()
    const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1
    const anoMesAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual
    if (diaAtual >= 5) {
      // Verificar se há lançamentos do mês anterior com status "aberto" ainda
      const lancMesAnteriorAbertos = lancamentos.filter(l => {
        const lMes = l.competencia_mes !== null && l.competencia_mes !== undefined
          ? l.competencia_mes
          : new Date(l.data + 'T00:00:00').getMonth()
        const lAno = l.competencia_ano !== null && l.competencia_ano !== undefined
          ? l.competencia_ano
          : new Date(l.data + 'T00:00:00').getFullYear()
        return lMes === mesAnterior && lAno === anoMesAnterior && l.status === 'aberto'
      })
      if (lancMesAnteriorAbertos.length > 0) {
        result.push({
          id: 'estrat-fechamento',
          priority: 'alta',
          category: 'estrategia',
          title: 'Fechamento do mês anterior pendente',
          description: `${lancMesAnteriorAbertos.length} lançamento${lancMesAnteriorAbertos.length > 1 ? 's' : ''} em aberto do mês anterior.`,
          link: '/fechamento',
          count: lancMesAnteriorAbertos.length,
        })
      }
    }

    // Ordenar por prioridade
    return result.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  }, [lancamentos, associados, diretoria, metas, kpis, loadingFin, loadingAssoc])

  const urgentCount = notifications.filter(
    n => n.priority === 'critico' || n.priority === 'urgente'
  ).length

  return { notifications, urgentCount, loading: loadingFin || loadingAssoc }
}
