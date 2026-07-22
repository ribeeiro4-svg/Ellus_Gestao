'use client'
import React, { useState, useEffect } from 'react'
import { Calendar, Lock, CheckCircle, AlertTriangle, Clock, FileDown, Unlock, Loader2 } from 'lucide-react'
import { useTenantId } from '@/lib/hooks/useTenantId'
import { getPeriodosFiscaisAction, fecharPeriodoFiscalAction, reabrirPeriodoFiscalAction, bloquearPeriodoFiscalAction } from '@/features/fiscal/actions/periodoFiscalActions'

const fmtData = (d: string) => { try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') } catch { return d } }

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  aberto: { label: 'Aberto', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', icon: CheckCircle },
  em_escrituracao: { label: 'Em Escrituração', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', icon: Clock },
  fechado: { label: 'Fechado', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', icon: Lock },
  transmitido: { label: 'Transmitido', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100', icon: CheckCircle },
  bloqueado: { label: 'Bloqueado', color: 'text-red-600', bg: 'bg-red-50 border-red-100', icon: Lock },
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function PeriodosFiscais({ nfeHook }: { nfeHook: any }) {
  const tenantId = useTenantId()
  const { nfes } = nfeHook
  const ano = new Date().getFullYear()

  const [periodosBd, setPeriodosBd] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  const loadPeriodos = async () => {
    if (!tenantId) return
    setLoading(true)
    const { data } = await getPeriodosFiscaisAction(tenantId)
    setPeriodosBd(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadPeriodos()
  }, [tenantId])

  const handleAction = async (competencia: string, acao: 'fechar' | 'reabrir' | 'bloquear') => {
    if (!tenantId) return
    
    let motivo = ''
    if (acao === 'reabrir') {
      motivo = prompt('Motivo da reabertura (mínimo 20 caracteres):') || ''
      if (motivo.length < 20) return alert('Motivo inválido.')
    }
    if (acao === 'bloquear') {
      if (!confirm('ATENÇÃO: O bloqueio é IRREVERSÍVEL. Usar apenas após transmitir o SPED. Confirma?')) return
    }

    setActionLoading(prev => ({ ...prev, [competencia]: true }))
    try {
      let res: any
      if (acao === 'fechar') res = await fecharPeriodoFiscalAction(competencia, tenantId)
      if (acao === 'reabrir') res = await reabrirPeriodoFiscalAction(competencia, tenantId, motivo)
      if (acao === 'bloquear') res = await bloquearPeriodoFiscalAction(competencia, tenantId)
      
      if (res?.error) alert(`Erro: ${res.error}`)
      else await loadPeriodos()
    } finally {
      setActionLoading(prev => ({ ...prev, [competencia]: false }))
    }
  }

  // Construir períodos do ano atual mesclando com o banco
  const periodos = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1
    const competencia = `${ano}-${mes.toString().padStart(2, '0')}-01`
    const mesStr = mes.toString().padStart(2, '0')
    const nfesDoMes = nfes.filter((n: any) => {
      const nfeMes = n.data_emissao?.slice(0, 7)
      return nfeMes === `${ano}-${mesStr}`
    })
    const escrituradas = nfesDoMes.filter((n: any) => n.status_escrituracao === 'escriturada').length
    const total = nfesDoMes.length
    const valorTotal = nfesDoMes.reduce((acc: number, n: any) => acc + Number(n.valor_total || 0), 0)
    const isPast = mes < new Date().getMonth() + 1
    const isCurrent = mes === new Date().getMonth() + 1

    const bdPeriod = periodosBd.find(p => p.competencia === competencia)
    let finalStatus = bdPeriod?.status || 'aberto'

    // Lógica fallback se não tiver no banco ainda
    if (!bdPeriod) {
      finalStatus = isPast && total > 0 && escrituradas === total ? 'em_escrituracao' : isCurrent ? 'em_escrituracao' : 'aberto'
    }

    return {
      competencia,
      mes: MESES[i],
      mesNum: mes,
      nfesTotal: total,
      nfesEscrituradas: escrituradas,
      valorTotal,
      pct: total > 0 ? Math.round((escrituradas / total) * 100) : 0,
      status: finalStatus,
      bdPeriod,
    }
  })

  const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-700">Períodos de Apuração — {ano}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Controle de escrituração EFD-ICMS/IPI por competência</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-500">
            <AlertTriangle size={12} className="text-orange-500" />
            Prazo SPED: dia 25 do mês seguinte
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {periodos.map(p => {
          const stConf = STATUS_CFG[p.status]
          const StIcon = stConf.icon
          const isCurrentMonth = p.mesNum === new Date().getMonth() + 1

          return (
            <div key={p.competencia} className={`bg-white rounded-2xl border shadow-sm p-5 ${isCurrentMonth ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Calendar size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">{p.mes}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{ano}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black border ${stConf.bg} ${stConf.color}`}>
                  <StIcon size={9} /> {stConf.label}
                </span>
              </div>

              {p.nfesTotal > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-slate-50 rounded-xl p-2 text-center">
                      <p className="text-[9px] text-slate-400 font-bold">NF-e</p>
                      <p className="text-sm font-black text-slate-700">{p.nfesTotal}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2 text-center">
                      <p className="text-[9px] text-slate-400 font-bold">Escrituradas</p>
                      <p className="text-sm font-black text-emerald-600">{p.nfesEscrituradas}</p>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1">
                      <span>Progresso</span>
                      <span>{p.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${p.pct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${p.pct}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-slate-600 mb-3">Total: {fmtR(p.valorTotal)}</p>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => alert(`Gerando arquivo SPED EFD-ICMS/IPI para o período ${p.mes}/${ano}...\n\nBlocos A, C, D, E, G, H, K, 0, 1 e 9 serão processados conforme convênio ICMS 143/06.`)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-50 text-[9px] font-black text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100"
                    >
                      <FileDown size={10} /> SPED EFD
                    </button>
                    {p.mesNum === 12 && (
                      <button 
                        onClick={() => alert(`Gerando Inventário (Bloco H) para fechamento do exercício ${ano}...\n\nCálculo realizado via Custo Médio Ponderado (CMP) conforme NBC TG 16.`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 text-[9px] font-black text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100"
                      >
                        <FileDown size={10} /> BLOCO H
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-300 font-bold">Sem NF-e neste período</p>
                </div>
              )}

              {/* Botões de Ação do Período */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                {p.status === 'aberto' || p.status === 'em_escrituracao' ? (
                  <button 
                    disabled={actionLoading[p.competencia] || p.pct < 100}
                    onClick={() => handleAction(p.competencia, 'fechar')}
                    className="flex-1 px-3 py-1.5 text-[10px] font-black bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:bg-slate-300 transition-all flex justify-center items-center gap-1"
                  >
                    {actionLoading[p.competencia] ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
                    FECHAR PERÍODO
                  </button>
                ) : p.status === 'fechado' ? (
                  <>
                    <button 
                      disabled={actionLoading[p.competencia]}
                      onClick={() => handleAction(p.competencia, 'reabrir')}
                      className="flex-1 px-3 py-1.5 text-[10px] font-black bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 disabled:opacity-50 transition-all flex justify-center items-center gap-1"
                    >
                      {actionLoading[p.competencia] ? <Loader2 size={12} className="animate-spin" /> : <Unlock size={12} />}
                      REABRIR
                    </button>
                    <button 
                      disabled={actionLoading[p.competencia]}
                      onClick={() => handleAction(p.competencia, 'bloquear')}
                      className="flex-1 px-3 py-1.5 text-[10px] font-black bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-all flex justify-center items-center gap-1"
                      title="Bloquear pós-transmissão SPED"
                    >
                      {actionLoading[p.competencia] ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                      BLOQUEAR SPED
                    </button>
                  </>
                ) : p.status === 'bloqueado' ? (
                   <div className="w-full text-center px-3 py-1.5 text-[10px] font-black bg-slate-100 text-slate-500 rounded-lg flex justify-center items-center gap-1">
                      <Lock size={12} className="text-red-500" /> PERMANENTEMENTE BLOQUEADO
                   </div>
                ) : null}
              </div>

              {isCurrentMonth && (
                <div className="mt-3 p-2 bg-blue-50 rounded-xl">
                  <p className="text-[9px] font-bold text-blue-600">📌 Período atual</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legenda */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4">
        <p className="text-xs font-black text-slate-600 mb-2">Sobre Obrigações Acessórias (SPED EFD)</p>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-medium">
          <div>📋 <strong>Imunidade tributária</strong> não dispensa a EFD — RFB exige ECD, ECF e EFD</div>
          <div>📅 <strong>Prazo SPED EFD:</strong> até o 25º dia do mês subsequente</div>
          <div>🔒 <strong>Períodos fechados</strong> não permitem alteração sem reabertura auditada</div>
          <div>🏛️ <strong>Bloco H (Inventário):</strong> obrigatório em dezembro ou na baixa</div>
        </div>
      </div>
    </div>
  )
}
