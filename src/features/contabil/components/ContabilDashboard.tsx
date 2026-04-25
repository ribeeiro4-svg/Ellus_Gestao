'use client'
import React, { useState } from 'react'
import { BookOpen, FileText, CheckCircle, TrendingUp, BarChart3, Download, Loader2 } from 'lucide-react'
import { useConfiguracoesContabeis } from '@/features/contabil/hooks/useConfiguracoesContabeis'
import ComplianceAlerts from './ComplianceAlerts'

const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export default function ContabilDashboard({ lancHook, planoHook }: { lancHook: any; planoHook: any }) {
  const { lancamentos, stats } = lancHook
  const { contas } = planoHook
  const { configuracoes } = useConfiguracoesContabeis()
  const [gerandoECD, setGerandoECD] = useState(false)
  const [auditandoContas, setAuditandoContas] = useState(false)
  const ano = new Date().getFullYear()

  const handleGerarECD = async () => {
    if (!confirm(`Gerar o arquivo ECD (SPED Contábil) para o exercício de ${ano}?\n\nO arquivo será baixado automaticamente no formato .txt compatível com o SPED da Receita Federal.`)) return
    setGerandoECD(true)
    try {
      const { gerarECDAction } = await import('@/features/contabil/actions/spedContabil')
      const res = await gerarECDAction(ano)
      if (res.error) {
        alert(`Erro ao gerar ECD: ${res.error}`)
        return
      }
      // Download automático do arquivo
      const blob = new Blob([res.conteudo!], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.nomeArquivo!
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      alert(`ECD gerado com sucesso!\n\n📄 Arquivo: ${res.nomeArquivo}\n📊 ${res.totalLinhas} linhas\n📒 ${res.totalLancamentos} lançamentos\n🏗️ ${res.totalContas} contas\n\nEncaminhe o arquivo ao seu contador para validação no PVA do SPED.`)
    } finally {
      setGerandoECD(false)
    }
  }

  const handleAuditoriaContas = async () => {
    setAuditandoContas(true)
    try {
      const { createMissingAccountsAction } = await import('@/features/contabil/actions/createMissingAccounts')
      const res = await createMissingAccountsAction()
      if (res.success) {
        alert(`Auditoria de Contas concluída!\n\n🆕 Novas contas criadas: ${res.created}\n✅ Contas já existentes: ${res.skipped}\n\nO Plano de Contas foi atualizado para suportar Provisões, Estagiários e Pró-Labore conforme solicitado.`)
        planoHook.refresh()
      }
    } catch (err) {
      alert('Erro ao processar auditoria.')
    } finally {
      setAuditandoContas(false)
    }
  }

  const kpis = [
    { label: 'Lançamentos', value: stats.total, sub: 'no livro diário', icon: BookOpen, color: '#6366f1' },
    { label: 'Confirmados', value: stats.confirmados, sub: 'lançamentos válidos', icon: CheckCircle, color: '#10b981' },
    { label: 'Estornados', value: stats.estornados, sub: 'lançamentos revertidos', icon: FileText, color: '#ef4444' },
    { label: 'Categorias Mapeadas', value: configuracoes.length, sub: 'ITG 2002 (R1)', icon: BarChart3, color: '#8b5cf6' },
  ]

  const ultimos5 = lancamentos.slice(0, 5)
  const fmtData = (d: string) => { try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') } catch { return d } }

  // Resumo por grupo
  const grupos = [
    { label: 'Contas do Ativo', qty: contas.filter((c: any) => c.classificacao === 'ativo').length, color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Contas do Passivo', qty: contas.filter((c: any) => c.classificacao === 'passivo').length, color: 'text-rose-700', bg: 'bg-rose-50' },
    { label: 'Patrimônio Social', qty: contas.filter((c: any) => c.classificacao === 'patrimonio_social').length, color: 'text-purple-700', bg: 'bg-purple-50' },
    { label: 'Ingressos Mapeados', qty: configuracoes.filter((c: any) => c.tipo === 'ingresso').length, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Dispêndios Mapeados', qty: configuracoes.filter((c: any) => c.tipo === 'dispendio').length, color: 'text-orange-700', bg: 'bg-orange-50' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <div key={i} className="kpi-card p-5" style={{ '--kpi-color': kpi.color } as any}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${kpi.color}18` }}>
                <Icon size={16} style={{ color: kpi.color }} />
              </div>
              <div className="text-2xl font-black text-slate-800">{kpi.value}</div>
              <div className="text-xs font-bold text-slate-500 mt-0.5">{kpi.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plano de contas summary */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-slate-700">🏗️ Plano de Contas ITG 2002</h3>
            <button 
              onClick={handleAuditoriaContas}
              disabled={auditandoContas}
              className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
            >
              {auditandoContas ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={10} />}
              {auditandoContas ? 'Verificando...' : 'Verificar Plano'}
            </button>
          </div>
          {contas.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-slate-300">
              <BookOpen size={32} className="mb-2" />
              <p className="text-xs font-bold">Plano não inicializado</p>
              <p className="text-[10px] text-slate-400 mt-1">Clique em "Inicializar Plano ITG 2002" acima</p>
            </div>
          ) : (
            <div className="space-y-2">
              {grupos.map((g, i) => (
                <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-xl ${g.bg}`}>
                  <span className={`text-xs font-bold ${g.color}`}>{g.label}</span>
                  <span className={`text-sm font-black ${g.color}`}>{g.qty} contas</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-50 border-t border-indigo-100">
                <span className="text-xs font-black text-indigo-700">Total de Contas</span>
                <span className="text-sm font-black text-indigo-700">{contas.length}</span>
              </div>
            </div>
          )}
        </div>

        {/* Últimos lançamentos */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-black text-slate-700 mb-4">📒 Últimos Lançamentos</h3>
          {ultimos5.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-slate-300">
              <FileText size={32} className="mb-2" />
              <p className="text-xs font-bold">Nenhum lançamento registrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ultimos5.map((l: any) => (
                <div key={l.id} className="flex items-start justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-indigo-600">{l.numero_lancamento}</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{l.historico}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-slate-400">{fmtData(l.data_lancamento)}</p>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${l.status === 'confirmado' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {l.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ComplianceAlerts lancHook={lancHook} planoHook={planoHook} configuracoes={configuracoes} />

      {/* Compliance panel */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5">
        <h3 className="text-sm font-black text-indigo-800 mb-3">📋 Obrigações Contábeis — ACPROBEC</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'ECD', sub: 'SPED Contábil', prazo: 'Até 31/07 do ano seguinte', status: 'pendente' },
            { label: 'ECF', sub: 'Escrit. Contábil Fiscal', prazo: 'Até 31/07 do ano seguinte', status: 'pendente' },
            { label: 'DCTF', sub: 'Declaração de Débitos', prazo: 'Mensal — dia 15', status: 'pendente' },
            { label: 'RAIS', sub: 'Relação Anual Informações', prazo: 'Março/Abril', status: 'pendente' },
          ].map((ob, i) => (
            <div key={i} className="bg-white rounded-xl p-3 border border-white/80 shadow-sm">
              <p className="text-xs font-black text-indigo-800">{ob.label}</p>
              <p className="text-[9px] text-slate-500 font-medium">{ob.sub}</p>
              <p className="text-[9px] text-orange-600 font-bold mt-1">⏰ {ob.prazo}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-[9px] text-indigo-500 font-medium">
            ℹ️ A imunidade tributária (art. 150, VI, "c" da CF/88) não dispensa as associações das obrigações acessórias — ECD, ECF, SPED EFD são obrigatórios.
          </p>
          <button
            onClick={handleGerarECD}
            disabled={gerandoECD}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-50 shadow-sm flex-shrink-0 ml-4"
          >
            {gerandoECD ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            {gerandoECD ? 'Gerando...' : `📥 Gerar ECD ${ano}`}
          </button>
        </div>
      </div>
    </div>
  )
}
