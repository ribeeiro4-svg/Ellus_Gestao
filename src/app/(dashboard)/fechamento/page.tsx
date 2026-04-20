'use client'
import { useState, useMemo, useEffect } from 'react'
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
  History
} from 'lucide-react'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useContas } from '@/lib/hooks/useContas'
import { useFechamento } from '@/lib/hooks/useFechamento'
import { fmtR } from '@/lib/utils/formatters'
import KpiCard from '@/components/ui/KpiCard'

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
  const [view, setView] = useState<'resumo' | 'ajustes'>('resumo')
  const [isSaving, setIsSaving] = useState(false)

  const isFechado = useMemo(() => {
    // Verifica se este mês específico OR algum futuro está fechado
    return isPeriodoBloqueado(new Date(selectedAno, selectedMes, 1).toISOString())
  }, [selectedMes, selectedAno, isPeriodoBloqueado])

  // Lógica de cálculo dos saldos
  const balances = useMemo(() => {
    return contas.map(conta => {
      const transacoesConta = lancamentos.filter(l => l.conta_id === conta.id)
      
      // Saldo Inicial: Soma de tudo ANTES do mês selecionado
      const saldoAnterior = transacoesConta
        .filter(l => {
          const d = new Date(l.data)
          return d.getFullYear() < selectedAno || (d.getFullYear() === selectedAno && d.getMonth() < selectedMes)
        })
        .reduce((sum, l) => sum + (l.tipo === 'receita' ? l.valor : -l.valor), conta.saldo_inicial || 0)

      // Movimentação do Mês (Somente Conciliados)
      const movimentacao = transacoesConta.filter(l => {
        const d = new Date(l.data)
        return d.getFullYear() === selectedAno && d.getMonth() === selectedMes && l.conciliado
      })

      const entradas = movimentacao.filter(l => l.tipo === 'receita').reduce((sum, l) => sum + l.valor, 0)
      const saidas = movimentacao.filter(l => l.tipo === 'despesa').reduce((sum, l) => sum + l.valor, 0)
      
      const saldoSistema = saldoAnterior + entradas - saidas
      const real = saldosReais[conta.id] || 0
      const diferenca = real - saldoSistema

      return {
        conta,
        saldoAnterior,
        entradas,
        saidas,
        saldoSistema,
        real,
        diferenca,
        unreconciled: transacoesConta.filter(l => {
          const d = new Date(l.data)
          return d.getFullYear() === selectedAno && d.getMonth() === selectedMes && !l.conciliado
        })
      }
    })
  }, [contas, lancamentos, selectedMes, selectedAno, saldosReais])

  const totalDiferenca = useMemo(() => balances.reduce((s, b) => s + Math.abs(b.diferenca), 0), [balances])

  const handleFechar = async () => {
    if (isFechado) return
    setIsSaving(true)

    try {
      // 1. Criar lançamentos de ajuste se houver diferença
      for (const b of balances) {
        if (Math.abs(b.diferenca) > 0.01) {
          await inserir({
            descricao: `Ajuste de Saldo (Fechamento ${MESES[selectedMes]}/${selectedAno})`,
            valor: Math.abs(b.diferenca),
            tipo: b.diferenca > 0 ? 'receita' : 'despesa',
            categoria: 'Ajuste de Saldo',
            data: new Date(selectedAno, selectedMes + 1, 0).toISOString(),
            status: 'pago',
            conciliado: true,
            conta_id: b.conta.id
          })
        }
      }

      // 2. Gravar o fechamento no banco
      const res = await fecharPeriodo(selectedMes, selectedAno, balances.map(b => ({
        conta_id: b.conta.id,
        saldo_inicial: b.saldoAnterior,
        saldo_final_sistema: b.saldoSistema,
        saldo_final_real: b.real,
        diferenca: b.diferenca
      })))

      if (res.error) alert(res.error)
      else alert('Período fechado com sucesso! Nenhuma alteração retroativa será permitida.')
      
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${isFechado ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
            {isFechado ? <Lock size={26} /> : <Unlock size={26} />}
          </div>
          <div>
            <h1 className="page-title text-2xl font-bold tracking-tight">Fechamento Mensal</h1>
            <p className="page-subtitle text-xs text-gray-500 font-medium tracking-tight">Consolide os saldos e proteja seus dados contra alterações.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-[20px] border border-gray-100 shadow-xl shadow-indigo-900/5">
          <select 
            value={selectedMes} 
            onChange={(e) => setSelectedMes(parseInt(e.target.value))}
            className="bg-transparent border-none text-xs font-black text-gray-700 focus:ring-0 p-0 px-4 cursor-pointer"
          >
            {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select 
             value={selectedAno} 
             onChange={(e) => setSelectedAno(parseInt(e.target.value))}
             className="bg-transparent border-none text-xs font-black text-gray-700 focus:ring-0 p-0 pr-4 cursor-pointer border-l border-gray-100"
          >
            {[2024, 2025, 2026].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {isFechado ? (
        <div className="bg-indigo-600 rounded-[32px] p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
          <History className="absolute -right-8 -bottom-8 w-64 h-64 text-white/5 rotate-12" />
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
            <Lock size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-black mb-4">Mês Encerrado</h2>
          <p className="text-white/70 max-w-md mx-auto mb-8 font-medium">Os dados de {MESES[selectedMes]} de {selectedAno} foram consolidados e estão protegidos contra edições ou exclusões.</p>
          
          <div className="flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-2xl text-[10px] font-black border border-white/10 backdrop-blur-sm uppercase tracking-widest">
              <CheckCircle2 size={16} /> Governança de Dados Ativa
            </div>
            
            <button 
              onClick={() => confirm('Tem certeza que deseja reabrir este período? Isso permitirá edições e exclusões retroativas.') && reabrirPeriodo(selectedMes, selectedAno)}
              className="px-8 py-4 bg-white text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-rose-50 transition-all flex items-center gap-2"
            >
              <Unlock size={16} /> Reabrir Período Agora
            </button>
          </div>
        </div>
      ) : (
        <>
          {view === 'resumo' ? (
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Entradas Conciliadas" value={fmtR(balances.reduce((s,b) => s+b.entradas, 0))} icon={<TrendingUp size={20} />} category="success" />
                <KpiCard title="Saídas Conciliadas" value={fmtR(balances.reduce((s,b) => s+b.saidas, 0))} icon={<TrendingDown size={20} />} category="error" />
                <KpiCard title="Total Diferença" value={fmtR(totalDiferenca)} icon={<AlertCircle size={20} />} category={totalDiferenca > 0 ? "error" : "success"} />
              </div>

              <div className="table-card">
                 <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                   <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
                     <Calculator size={16} className="text-indigo-600" /> Saldos por Conta/Caixa
                   </h2>
                 </div>
                 <div className="p-0 overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="bg-gray-50/50">
                         <th className="p-5 text-[10px] font-black text-gray-400 uppercase">Conta</th>
                         <th className="p-5 text-[10px] font-black text-gray-400 uppercase text-right">Saldo Anterior</th>
                         <th className="p-5 text-[10px] font-black text-gray-400 uppercase text-right">Saldo Sistema</th>
                         <th className="p-5 text-[10px] font-black text-gray-400 uppercase text-center w-[200px]">Saldo Real (Extrato)</th>
                         <th className="p-5 text-[10px] font-black text-gray-400 uppercase text-right">Diferença</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                       {balances.map((b) => (
                         <tr key={b.conta.id} className="hover:bg-slate-50 transition-colors">
                           <td className="p-5">
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><Wallet size={16} /></div>
                               <span className="text-sm font-bold text-gray-900">{b.conta.nome}</span>
                             </div>
                           </td>
                           <td className="p-5 text-right text-xs font-bold text-gray-500">{fmtR(b.saldoAnterior)}</td>
                           <td className="p-5 text-right text-sm font-black text-gray-900">{fmtR(b.saldoSistema)}</td>
                           <td className="p-5">
                             <input 
                               type="number" 
                               value={saldosReais[b.conta.id] || ''} 
                               onChange={(e) => setSaldosReais(prev => ({ ...prev, [b.conta.id]: parseFloat(e.target.value) }))}
                               placeholder="R$ 0,00"
                               className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-indigo-700 text-center outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                             />
                           </td>
                           <td className={`p-5 text-right text-sm font-bold ${Math.abs(b.diferenca) < 0.01 ? 'text-emerald-500' : 'text-orange-500'}`}>
                             {fmtR(b.diferenca)}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
              </div>

              <div className="flex items-center justify-between p-8 bg-indigo-50 rounded-[32px] border border-indigo-100">
                <div className="flex items-center gap-4 text-indigo-900">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-indigo-600"><AlertCircle /></div>
                  <div>
                    <h3 className="text-sm font-bold">Deseja revisar os lançamentos?</h3>
                    <p className="text-xs font-medium text-indigo-600/70">Ainda há itens não conciliados neste período.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setView('ajustes')} className="px-6 py-3 bg-white text-indigo-600 rounded-2xl text-xs font-black shadow-sm hover:shadow-md transition-all">TELA DE AJUSTES</button>
                  <button 
                    onClick={handleFechar} 
                    disabled={isSaving}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                  >
                    {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Lock size={14} />} FECHAR PERÍODO AGORA
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <button onClick={() => setView('resumo')} className="flex items-center gap-2 text-indigo-600 font-bold text-xs"><ArrowRight size={14} className="rotate-180" /> VOLTAR AO RESUMO</button>
              
              <div className="table-card">
                 <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                   <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Itens Pendentes de Conciliação</h2>
                   <div className="text-[10px] font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-full uppercase">Estes itens geram a diferença</div>
                 </div>
                 <div className="p-0">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50/50">
                          <th className="p-5 text-[10px] font-black text-gray-400 uppercase">Data</th>
                          <th className="p-5 text-[10px] font-black text-gray-400 uppercase">Descrição</th>
                          <th className="p-5 text-[10px] font-black text-gray-400 uppercase">Conta</th>
                          <th className="p-5 text-[10px] font-black text-gray-400 uppercase text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {balances.flatMap(b => b.unreconciled).map((l: any) => (
                          <tr key={l.id} className="text-xs font-medium text-gray-600">
                            <td className="p-5 font-bold">{new Date(l.data).toLocaleDateString()}</td>
                            <td className="p-5">{l.descricao}</td>
                            <td className="p-5">{contas.find(c => c.id === l.conta_id)?.nome}</td>
                            <td className={`p-5 text-right font-black ${l.tipo === 'receita' ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtR(l.valor)}</td>
                          </tr>
                        ))}
                        {balances.every(b => b.unreconciled.length === 0) && (
                          <tr>
                            <td colSpan={4} className="p-10 text-center text-gray-400 font-medium italic">Nenhum item pendente. Se houver diferença, será gerado um ajuste de saldo automático.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                 </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
