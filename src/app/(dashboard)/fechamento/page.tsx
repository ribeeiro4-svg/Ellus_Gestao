'use client'
import { useState, useMemo, useEffect } from 'react'
import { ConfirmacaoSenhaTesoureiro } from '@/components/ui/ConfirmacaoSenhaTesoureiro'
import { 
  Lock, 
  Unlock, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Calculator,
  RefreshCw,
  Wallet,
  TrendingUp,
  TrendingDown,
  History,
  Printer,
  FileCheck,
  FileText
} from 'lucide-react'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useContas } from '@/lib/hooks/useContas'
import { useFechamento } from '@/lib/hooks/useFechamento'
import { createClient } from '@/lib/supabase/client'
import { fmtR, getMesIdx, getAnoIdx, safeSum, safeDiff, getBruto } from '@/lib/utils/formatters'
import KpiCard from '@/components/ui/KpiCard'

// Componente de Logo para o Relatório
const LogoReport = () => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[18px] font-bold bg-gradient-to-br from-[#2d8c6f] to-[#34d399] shadow-lg">
      AC
    </div>
    <div className="flex flex-col">
      <span className="text-[17px] font-extrabold text-[#0e2d22] tracking-tight leading-none">ACPROBEC</span>
      <span className="text-[8px] text-gray-400 tracking-[1.2px] font-bold uppercase">Gestão Inteligente</span>
    </div>
  </div>
)

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default function FechamentoPage() {
  const { lancamentos, inserir } = useFinanceiro()
  const { contas, loading: contasLoading } = useContas()
  const { fechamentos, fecharPeriodo, isPeriodoBloqueado, reabrirPeriodo } = useFechamento()

  const [selectedMes, setSelectedMes] = useState(new Date().getMonth())
  const [selectedAno, setSelectedAno] = useState(new Date().getFullYear())
  const [saldosReais, setSaldosReais] = useState<Record<string, number>>({})
  const [bankAmounts, setBankAmounts] = useState<Record<string, number>>({})
  const [view, setView] = useState<'resumo' | 'ajustes'>('resumo')
  const [isSaving, setIsSaving] = useState(false)
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false)
  const sb = createClient()

  // Carregar valores reais do extrato para auditoria fina
  useEffect(() => {
    const fetchBankData = async () => {
      // Buscar Cora e OFX (sem filtros restritivos para garantir histórico)
      const { data: cora } = await sb.from('cora_staged')
        .select('cora_id, valor')
        .eq('status', 'sincronizado')
        .limit(5000)

      const { data: ofx } = await sb.from('ofx_transactions')
        .select('fitid, amount')
        .limit(5000)
      
      const map: Record<string, number> = {}
      cora?.forEach(c => { if (c.cora_id) map[c.cora_id] = Math.abs(Number(c.valor)) })
      ofx?.forEach(o => { if (o.fitid) map[o.fitid] = Math.abs(Number(o.amount)) })
      setBankAmounts(map)
    }
    fetchBankData()
  }, [])

  const isFechado = useMemo(() => {
    return !!fechamentos?.find(f => f.mes === selectedMes && f.ano === selectedAno)
  }, [selectedMes, selectedAno, fechamentos])

  const isBloqueado = useMemo(() => {
    return isPeriodoBloqueado(new Date(selectedAno, selectedMes, 1).toISOString())
  }, [selectedMes, selectedAno, isPeriodoBloqueado])

  const handleReabrir = () => {
    // Abre o modal de confirmação de senha do Tesoureiro
    setModalSenhaAberto(true)
  }

  const handleReabrirConfirmado = async () => {
    setModalSenhaAberto(false)
    await reabrirPeriodo(selectedMes, selectedAno)
    alert('Período reaberto com sucesso. Os valores foram recalculados.')
  }

  const handlePrint = () => {
    const originalTitle = document.title
    document.title = `Éllus · Relatorio de Fechamento - ${MESES[selectedMes]} ${selectedAno}`
    window.print()
    setTimeout(() => {
      document.title = originalTitle
    }, 500)
  }


  const getRealizedInfo = (l: any) => {
    const statusLower = (l.status || '').toLowerCase()
    const isPaid = ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso', 'parcial'].includes(statusLower) || !!l.data_conciliacao
    const dateToUse = (isPaid && l.data_conciliacao) ? l.data_conciliacao : l.data;
    if (!dateToUse) return { isPaid: false, m: -1, y: -1 }
    return { isPaid, m: getMesIdx(dateToUse), y: getAnoIdx(dateToUse) }
  }

  const balances = useMemo(() => {
    return contas.map(conta => {
      const transacoesConta = lancamentos.filter(l => l.conta_id === conta.id)
      
      const saldoAnterior = (() => {
        const fechamentosOrdenados = [...(fechamentos || [])]
          .filter(f => f.ano < selectedAno || (f.ano === selectedAno && f.mes < selectedMes))
          .sort((a, b) => b.ano - a.ano || b.mes - a.mes)
        
        const ultimoFechamento = fechamentosOrdenados[0]
        const snapshotAnterior = ultimoFechamento?.snapshot?.find((s: any) => s.conta_id === conta.id)
        
        let baseBalance = snapshotAnterior ? snapshotAnterior.saldo_final_real : (conta.saldo_inicial || 0)
        
        const startM = ultimoFechamento ? ultimoFechamento.mes + 1 : -1
        const startY = ultimoFechamento ? ultimoFechamento.ano : -1

        return lancamentos.reduce((sum, l) => {
          if (l.conta_id !== conta.id) return sum
          const st = getRealizedInfo(l)
          if (!st.isPaid) return sum

          const dateToUse = l.data_conciliacao || l.data
          const m = getMesIdx(dateToUse)
          const y = getAnoIdx(dateToUse)

          const isAfterLast = !ultimoFechamento || (y > startY || (y === startY && m >= startM))
          const isBeforeCurrent = y < selectedAno || (y === selectedAno && m < selectedMes)

          if (isAfterLast && isBeforeCurrent) {
            const v = Math.abs(Number(l.valor) || 0)
            const tipo = (l.tipo || '').toLowerCase()
            const cat = (l.categoria || '').toLowerCase()
            if (cat.includes('transferência interna')) return sum

            const impact = v
            
            if (tipo === 'receita') return safeSum(sum, impact)
            else return safeDiff(sum, impact)
          }
          return sum
        }, baseBalance)
      })()

      // Cálculo de Entradas/Saídas do Mês Atual
      let pInc = 0, pExp = 0, movimEntrada = 0, movimSaida = 0 

      transacoesConta.forEach(l => {
        const st = getRealizedInfo(l)
        if (!st.isPaid) return

        const dateToUse = l.data_conciliacao || l.data
        const m = getMesIdx(dateToUse)
        const y = getAnoIdx(dateToUse)

        if (m === selectedMes && y === selectedAno) {
          const valBruto = Math.abs(Number(l.valor) || 0)
          const match = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/);
          const taxaVal = match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0;
          const v = valBruto + taxaVal // Adiciona a taxa de volta para o Fechamento bater com a Auditoria
          
          const tipo = (l.tipo || '').toLowerCase()
          const cat = (l.categoria || '').toLowerCase()
          const isTransfer = cat.includes('transferência interna')

          const impact = v

          if (tipo === 'receita') movimEntrada = safeSum(movimEntrada, impact)
          else movimSaida = safeSum(movimSaida, impact)

          // 3. KPIs
          if (!isTransfer) {
            if (tipo === 'receita') {
              pInc = safeSum(pInc, v)
            } else {
              pExp = safeSum(pExp, v)
            }
          }
        }
      })

      const saldoSistema = safeDiff(safeSum(saldoAnterior, movimEntrada), movimSaida)
      const fechamentoAtual = fechamentos?.find(f => f.mes === selectedMes && f.ano === selectedAno)
      const snapshotAtual = fechamentoAtual?.snapshot?.find((s: any) => s.conta_id === conta.id)
      const real = (isFechado && snapshotAtual) ? snapshotAtual.saldo_final_real : (saldosReais[conta.id] || 0)
      const diferenca = safeDiff(real, saldoSistema)

      return {
        conta,
        saldoAnterior,
        entradas: pInc,
        saidas: pExp,
        saldoSistema,
        real,
        diferenca,
        unreconciled: transacoesConta.filter(l => {
          const st = getRealizedInfo(l)
          const dateToUse = l.data_conciliacao || l.data
          const m = getMesIdx(dateToUse)
          const y = getAnoIdx(dateToUse)
          return m === selectedMes && y === selectedAno && !st.isPaid
        })
      }
    })
  }, [contas, lancamentos, selectedMes, selectedAno, saldosReais, fechamentos, bankAmounts])

  const globalTotals = useMemo(() => {
    const entradas = balances.reduce((sum, b) => safeSum(sum, b.entradas), 0)
    const saidas = balances.reduce((sum, b) => safeSum(sum, b.saidas), 0)
    return { entradas, saidas, resultado: safeDiff(entradas, saidas) }
  }, [balances])

  const totalDiferenca = useMemo(() => {
    return balances.reduce((sum, b) => safeSum(sum, Math.abs(b.diferenca)), 0)
  }, [balances])

  const handleFechar = async () => {
    if (totalDiferenca > 0.01) {
      if (!confirm('Atenção: Existe uma divergência. O sistema criará um ajuste automático. Deseja continuar?')) return
    }
    setIsSaving(true)
    try {
      for (const b of balances) {
        if (Math.abs(b.diferenca) > 0.01) {
          await inserir({
            descricao: `Ajuste de Saldo (Fechamento ${MESES[selectedMes]}/${selectedAno})`,
            valor: Math.abs(b.diferenca),
            tipo: b.diferenca > 0 ? 'receita' : 'despesa',
            categoria: 'Ajuste de Saldo',
            conta_id: b.conta.id,
            data: new Date(selectedAno, selectedMes, 28).toISOString(),
            status: 'pago',
            data_conciliacao: new Date(selectedAno, selectedMes, 28).toISOString()
          })
        }
      }
      await fecharPeriodo(selectedMes, selectedAno, balances.map(b => ({
        conta_id: b.conta.id,
        saldo_inicial: b.saldoAnterior,
        saldo_final_sistema: b.saldoSistema,
        saldo_final_real: b.real,
        diferenca: b.diferenca
      })))
    } finally {
      setIsSaving(false)
    }
  }

  if (contasLoading) return <div className="p-20 text-center font-bold text-[#0e2d22]">Carregando...</div>

  return (
    <div className="p-6 space-y-6">
      
      {/* Modal de Confirmação de Senha do Tesoureiro */}
      <ConfirmacaoSenhaTesoureiro
        isOpen={modalSenhaAberto}
        onClose={() => setModalSenhaAberto(false)}
        onConfirmed={handleReabrirConfirmado}
        titulo="Reabrir Período Fechado"
        descricao={`Você está prestes a reabrir ${MESES[selectedMes]}/${selectedAno}. Esta ação remove a proteção do período e permite alterações nos lançamentos. Confirme com a senha do Tesoureiro para prosseguir.`}
      />

      {/* Header Original */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <Lock className="text-emerald-900" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">FECHAMENTO MENSAL</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Conciliação e Governança — ACPROBEC</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select value={selectedMes} onChange={(e) => setSelectedMes(parseInt(e.target.value))} className="bg-gray-50 text-[10px] font-bold uppercase px-3 py-2 rounded-lg border-none outline-none">
            {MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select value={selectedAno} onChange={(e) => setSelectedAno(parseInt(e.target.value))} className="bg-gray-50 text-[10px] font-bold uppercase px-3 py-2 rounded-lg border-none outline-none">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {isFechado ? (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-emerald-950 rounded-2xl p-12 text-center shadow-2xl border border-emerald-800/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Lock size={120} className="text-white" />
              </div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-900/50 rounded-full mb-6 border border-emerald-700/50">
                  <Lock className="text-emerald-400" size={32} />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">MÊS ENCERRADO</h2>
                <p className="text-emerald-200/70 mb-8 max-w-md mx-auto font-medium">
                  Os dados de {MESES[selectedMes]} de {selectedAno} estão consolidados e auditados.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20 uppercase text-xs tracking-widest">
                    <FileText size={18} />
                    Relatório de Fechamento
                  </button>
                  <button 
                    onClick={handleReabrir}
                    className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/10 uppercase text-xs tracking-widest"
                  >
                    <RefreshCw size={18} />
                    Reabrir Período
                  </button>
                </div>
              </div>
            </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
             <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
               <h2 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-2"><History size={14} /> Extrato Consolidado</h2>
               <div className="px-3 py-1 bg-emerald-50 text-emerald-900 rounded-full text-[9px] font-bold uppercase">Somente Leitura</div>
             </div>
             <table className="w-full text-left text-xs">
               <thead>
                 <tr className="text-slate-400 font-bold border-b border-gray-50 uppercase text-[9px]">
                   <th className="p-4">Conta</th>
                   <th className="p-4 text-right">Anterior</th>
                   <th className="p-4 text-right">Entradas</th>
                   <th className="p-4 text-right">Saídas</th>
                   <th className="p-4 text-right">Sistema</th>
                   <th className="p-4 text-right">Real</th>
                   <th className="p-4 text-right">Divergência</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {balances.map(b => (
                   <tr key={b.conta.id} className="text-slate-600 font-medium">
                     <td className="p-4 font-bold">{b.conta.nome}</td>
                     <td className="p-4 text-right">{fmtR(b.saldoAnterior)}</td>
                     <td className="p-4 text-right text-emerald-600">{fmtR(b.entradas)}</td>
                     <td className="p-4 text-right text-rose-500">{fmtR(b.saidas)}</td>
                     <td className="p-4 text-right font-bold text-slate-900">{fmtR(b.saldoSistema)}</td>
                     <td className="p-4 text-right font-bold text-emerald-600">{fmtR(b.real)}</td>
                     <td className={`p-4 text-right font-bold ${Math.abs(b.diferenca) < 0.01 ? 'text-emerald-500' : 'text-rose-400'}`}>{fmtR(b.diferenca)}</td>
                   </tr>
                 ))}
               </tbody>
               <tfoot>
                 <tr className="border-t-2 border-gray-100 font-bold text-slate-800 bg-gray-50/30">
                   <td className="p-4 uppercase text-[9px]">Total Geral</td>
                   <td className="p-4 text-right text-slate-500">{fmtR(balances.reduce((sum, b) => safeSum(sum, b.saldoAnterior), 0))}</td>
                   <td className="p-4 text-right text-emerald-600">{fmtR(globalTotals.entradas)}</td>
                   <td className="p-4 text-right text-rose-500">{fmtR(globalTotals.saidas)}</td>
                   <td className="p-4 text-right text-slate-900">{fmtR(balances.reduce((sum, b) => safeSum(sum, b.saldoSistema), 0))}</td>
                   <td className="p-4 text-right text-emerald-600">{fmtR(balances.reduce((sum, b) => safeSum(sum, b.real), 0))}</td>
                   <td className="p-4 text-right text-emerald-500">OK</td>
                 </tr>
               </tfoot>
             </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard title="Entradas Conciliadas" value={fmtR(globalTotals.entradas)} icon={<TrendingUp size={18} />} category="success" />
            <KpiCard title="Saídas Conciliadas" value={fmtR(globalTotals.saidas)} icon={<TrendingDown size={18} />} category="error" />
            <KpiCard title="Resultado do Período" value={fmtR(globalTotals.resultado)} icon={<Calculator size={18} />} category="success" />
            <KpiCard title="Divergência (Audit)" value={fmtR(totalDiferenca)} icon={<AlertCircle size={18} />} category={totalDiferenca > 0.01 ? "error" : "success"} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
             <div className="p-4 border-b border-gray-50 bg-gray-50/50">
               <h2 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-2"><Calculator size={14} /> Saldos por Conta/Caixa</h2>
             </div>
             <table className="w-full text-left text-xs">
               <thead>
                 <tr className="text-slate-400 font-bold border-b border-gray-50 uppercase text-[9px]">
                   <th className="p-4">Conta</th>
                   <th className="p-4 text-right">Anterior</th>
                   <th className="p-4 text-right">Entradas</th>
                   <th className="p-4 text-right">Saídas</th>
                   <th className="p-4 text-right">Sistema</th>
                   <th className="p-4 text-center w-[180px]">Real (Extrato)</th>
                   <th className="p-4 text-right">Diferença</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {balances.map(b => (
                   <tr key={b.conta.id} className="text-slate-600 font-medium">
                     <td className="p-4 font-bold">{b.conta.nome}</td>
                     <td className="p-4 text-right text-slate-400">{fmtR(b.saldoAnterior)}</td>
                     <td className="p-4 text-right text-emerald-600">{fmtR(b.entradas)}</td>
                     <td className="p-4 text-right text-rose-500">{fmtR(b.saidas)}</td>
                     <td className="p-4 text-right font-bold text-slate-900">{fmtR(b.saldoSistema)}</td>
                     <td className="p-4">
                       <input 
                         type="number" 
                         value={saldosReais[b.conta.id] || ''} 
                         onChange={(e) => setSaldosReais(prev => ({ ...prev, [b.conta.id]: parseFloat(e.target.value) }))}
                         placeholder="0,00"
                         className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-center font-bold text-[#0e2d22] outline-none focus:ring-1 focus:ring-emerald-200 transition-all"
                       />
                     </td>
                     <td className={`p-4 text-right font-bold ${b.real === 0 ? 'text-slate-300' : Math.abs(b.diferenca) < 0.01 ? 'text-emerald-500' : 'text-orange-500'}`}>{fmtR(b.diferenca)}</td>
                   </tr>
                 ))}
               </tbody>
               <tfoot>
                 <tr className="border-t-2 border-gray-100 font-bold text-slate-800 bg-gray-50/30">
                   <td className="p-4 uppercase text-[9px]">Total Geral</td>
                   <td className="p-4 text-right text-slate-500">{fmtR(balances.reduce((sum, b) => safeSum(sum, b.saldoAnterior), 0))}</td>
                   <td className="p-4 text-right text-emerald-600">{fmtR(globalTotals.entradas)}</td>
                   <td className="p-4 text-right text-rose-500">{fmtR(globalTotals.saidas)}</td>
                   <td className="p-4 text-right text-slate-900">{fmtR(balances.reduce((sum, b) => safeSum(sum, b.saldoSistema), 0))}</td>
                   <td className="p-4 text-right text-emerald-600">{fmtR(balances.reduce((sum, b) => safeSum(sum, b.real), 0))}</td>
                   <td className={`p-4 text-right ${totalDiferenca < 0.01 ? 'text-emerald-500' : 'text-orange-500'}`}>
                     {totalDiferenca < 0.01 ? 'OK' : fmtR(totalDiferenca)}
                   </td>
                 </tr>
               </tfoot>
             </table>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
             <div className="p-4 border-b border-gray-50 bg-emerald-50/20 flex items-center justify-between">
               <h2 className="text-[10px] font-bold text-[#0e2d22] uppercase tracking-wider flex items-center gap-2"><FileCheck size={14} /> Auditoria Detalhada (Mês Atual)</h2>
               <span className="text-[8px] font-bold text-emerald-600 uppercase">Itens Pagos</span>
             </div>
             <table className="w-full text-left text-[10px]">
                      <thead>
                        <tr className="bg-gray-50/50 text-[10px] font-black text-slate-400 uppercase">
                          <th className="p-3">Data</th>
                          <th className="p-3">Conta</th>
                          <th className="p-3">Descrição</th>
                          <th className="p-3 text-right">Valor Original</th>
                          <th className="p-3 text-right text-slate-600">Vlr. p/ Saldo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {balances.map(b => (
                          lancamentos
                          .filter(l => l.conta_id === b.conta.id)
                          .map(l => ({ l, st: getRealizedInfo(l) }))
                          .filter(({ l, st }) => {
                            const dateToUse = l.data_conciliacao || l.data
                            const m = getMesIdx(dateToUse)
                            const y = getAnoIdx(dateToUse)
                            return st.isPaid && m === selectedMes && y === selectedAno
                          }).map(({ l }) => {
                            const val = Number(l.valor) || 0
                            const match = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/);
                            const taxaVal = match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0;
                            const hasTax = taxaVal > 0
                            
                            return (
                              <tr key={l.id} className="text-slate-500 hover:bg-emerald-50/5">
                                <td className="p-3">{new Date(l.data_conciliacao || l.data).toLocaleDateString()}</td>
                                <td className="p-3 font-bold text-[9px] uppercase text-[#0e2d22]">{b.conta.nome}</td>
                                <td className="p-3 truncate max-w-[300px]">{l.descricao}</td>
                                <td className="p-3 text-right text-slate-300 line-through">{hasTax ? fmtR(val) : '--'}</td>
                                <td className={`p-3 text-right font-black ${l.tipo === 'receita' ? 'text-emerald-600' : 'text-rose-600'} ${hasTax ? 'bg-emerald-50/30' : ''}`}>
                                  {l.tipo === 'receita' ? '+' : '-'}{fmtR(val + taxaVal)}
                                </td>
                              </tr>
                            )
                          })
                        ))}
                      </tbody>
             </table>
          </div>

          <div className="flex items-center justify-between p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-4 text-emerald-900">
              <AlertCircle className="text-[#0e2d22]" />
              <div>
                <h3 className="text-xs font-bold uppercase">Revisar Lançamentos</h3>
                <p className="text-[10px] font-medium opacity-70">Existem itens não conciliados neste período.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setView('ajustes')} className="px-5 py-2.5 bg-white text-[#0e2d22] rounded-xl text-[10px] font-bold uppercase shadow-sm">AJUSTES</button>
              <button onClick={handleFechar} disabled={isSaving} className="px-5 py-2.5 bg-[#0e2d22] text-white rounded-xl text-[10px] font-bold uppercase flex items-center gap-2 shadow-lg">
                {isSaving ? <RefreshCw className="animate-spin" size={12} /> : <Lock size={12} />} FECHAR PERÍODO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camada de Impressão */}
      <div className="hidden print:block fixed inset-0 bg-white p-12 z-[9999]">
        <div className="flex justify-between items-start border-b-2 border-[#0e2d22] pb-6 mb-6">
          <div>
            <LogoReport />
            <h1 className="text-xl font-bold text-[#0e2d22] uppercase mt-4">Fechamento Financeiro</h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase">Protocolo de Auditoria</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#0e2d22]">{MESES[selectedMes]} {selectedAno}</div>
          </div>
        </div>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-100 text-gray-400 uppercase text-[9px]">
              <th className="py-3 text-left">Conta</th>
              <th className="py-3 text-right">Anterior</th>
              <th className="py-3 text-right">Entradas</th>
              <th className="py-3 text-right">Saídas</th>
              <th className="py-3 text-right">Sistema</th>
              <th className="py-3 text-right">Real</th>
              <th className="py-3 text-right">Diferença</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {balances.map(b => (
              <tr key={b.conta.id}>
                <td className="py-3 font-bold">{b.conta.nome}</td>
                <td className="py-3 text-right text-gray-400">{fmtR(b.saldoAnterior)}</td>
                <td className="py-3 text-right text-emerald-600">{fmtR(b.entradas)}</td>
                <td className="py-3 text-right text-rose-500">{fmtR(b.saidas)}</td>
                <td className="py-3 text-right">{fmtR(b.saldoSistema)}</td>
                <td className="py-3 text-right font-bold text-emerald-600">{fmtR(b.real)}</td>
                <td className="py-3 text-right font-bold text-emerald-500">OK</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-100 font-bold text-[#0e2d22]">
              <td className="py-3 uppercase text-[9px]">Total Geral</td>
              <td className="py-3 text-right text-gray-400">{fmtR(balances.reduce((sum, b) => safeSum(sum, b.saldoAnterior), 0))}</td>
              <td className="py-3 text-right text-emerald-600">{fmtR(globalTotals.entradas)}</td>
              <td className="py-3 text-right text-rose-500">{fmtR(globalTotals.saidas)}</td>
              <td className="py-3 text-right">{fmtR(balances.reduce((sum, b) => safeSum(sum, b.saldoSistema), 0))}</td>
              <td className="py-3 text-right text-emerald-600">{fmtR(balances.reduce((sum, b) => safeSum(sum, b.real), 0))}</td>
              <td className="py-3 text-right text-emerald-500">OK</td>
            </tr>
          </tfoot>
        </table>
        <div className="mt-20 grid grid-cols-2 gap-10 text-center">
          <div><div className="border-t border-gray-300 w-40 mx-auto mt-10" /><p className="text-[8px] font-bold uppercase mt-2 text-gray-400">Responsável</p></div>
          <div><div className="border-t border-gray-300 w-40 mx-auto mt-10" /><p className="text-[8px] font-bold uppercase mt-2 text-gray-400">Conselho</p></div>
        </div>
      </div>
    </div>
  )
}
