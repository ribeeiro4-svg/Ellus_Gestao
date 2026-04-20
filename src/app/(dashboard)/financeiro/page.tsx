'use client'
import React, { useMemo, useState } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Chart, Line } from 'react-chartjs-2'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useContas } from '@/lib/hooks/useContas'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useFornecedores } from '@/lib/hooks/useFornecedores'
import { useDiretoria } from '@/lib/hooks/useDiretoria'
import { useCategorias } from '@/lib/hooks/useCategorias'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import CrudModal, { Field } from '@/components/ui/CrudModal'
import PaymentBadge from '@/components/ui/PaymentBadge'
import ChartCard from '@/components/ui/ChartCard'
import { fmtR, fmtData, MESES, safeSum, safeDiff } from '@/lib/utils/formatters'
import { Plus, Pencil, BarChart2, RefreshCw, Search, XCircle } from 'lucide-react'
import { processFinancialSubmit } from '@/features/financeiro/utils/processFinancialSubmit'
import FinancialKpiGrid from '@/features/financeiro/components/FinancialKpiGrid'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler)

export default function FinanceiroPage() {
  const { 
    lancamentos, loading, inserir, atualizar, remover, 
    removerBulk, inserirBulk, atualizarBulk, conciliar, remanejar 
  } = useFinanceiro()
  const { contas } = useContas()
  const { associados } = useAssociados()
  const { fornecedores } = useFornecedores()
  const { diretoria } = useDiretoria()
  const { categorias } = useCategorias()

  const [activeTab, setActiveTab] = useState<'geral' | 'receitas' | 'despesas'>('geral')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth())
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)

  // Filtros aplicados baseados na aba ativa
  const filteredLancamentos = useMemo(() => {
    return lancamentos.filter(item => {
      const d = new Date(item.data)
      const matchPeriod = (filterMonth === -1 || d.getMonth() === filterMonth) && d.getFullYear() === filterYear
      const matchSearch = (item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || item.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
      
      let matchType = true
      if (activeTab === 'receitas') matchType = item.tipo === 'receita'
      if (activeTab === 'despesas') matchType = item.tipo === 'despesa'
      
      return matchPeriod && matchSearch && matchType
    })
  }, [lancamentos, filterYear, filterMonth, activeTab, searchTerm])

  // KPIs e Gráficos (Mantendo design premium)
  const chartData = useMemo(() => {
    const rR = Array(12).fill(0), rP = Array(12).fill(0), dR = Array(12).fill(0), dP = Array(12).fill(0)
    lancamentos.forEach(l => {
      const d = new Date(l.data); if (d.getFullYear() !== filterYear) return
      const m = d.getMonth(); if (isNaN(m)) return
      const match = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/);
      const taxaVal = match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0;
      const valorComTaxa = safeSum(l.valor || 0, taxaVal);
      if (l.tipo === 'receita') {
        l.status === 'pago' ? rR[m] = safeSum(rR[m], valorComTaxa) : rP[m] = safeSum(rP[m], valorComTaxa)
      } else {
        l.status === 'pago' ? dR[m] = safeSum(dR[m], l.valor) : dP[m] = safeSum(dP[m], l.valor)
      }
    })
    return { recReal: rR, recProv: rP, despReal: dR, despProv: dP }
  }, [lancamentos, filterYear])

  const kpiData = useMemo(() => {
    let pInc = 0, pExp = 0, oInc = 0, oExp = 0, fCash = 0, fBank = 0
    lancamentos.forEach(l => {
      const d = new Date(l.data); if (d.getFullYear() !== filterYear) return
      const m = d.getMonth()
      const match = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/)
      const taxaVal = match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0
      const valorComTaxa = safeSum(l.valor || 0, taxaVal)
      if (m <= filterMonth && l.status === 'pago') {
        if (l.tipo === 'receita') l.forma_pagamento === 'Dinheiro' ? fCash = safeSum(fCash, valorComTaxa) : fBank = safeSum(fBank, valorComTaxa)
        else l.forma_pagamento === 'Dinheiro' ? fCash = safeDiff(fCash, l.valor) : fBank = safeDiff(fBank, l.valor)
      }
      if (m === filterMonth) {
        if (l.tipo === 'receita') l.status === 'pago' ? pInc = safeSum(pInc, valorComTaxa) : oInc = safeSum(oInc, valorComTaxa)
        else l.status === 'pago' ? pExp = safeSum(pExp, l.valor) : oExp = safeSum(oExp, l.valor)
      }
    })
    return { pInc, pExp, realizado: safeDiff(pInc, pExp), provisionado: safeDiff(oInc, oExp), receitaProjetada: safeSum(pInc, oInc), projetado: safeSum(safeDiff(pInc, pExp), safeDiff(oInc, oExp)), saldoCaixa: fCash, saldoBanco: fBank }
  }, [lancamentos, filterYear, filterMonth])

  const handleSalvar = async (data: any) => {
    setSaving(true)
    try {
      const res = await processFinancialSubmit(data, editingItem, associados, { inserir, atualizar, inserirBulk })
      if (res?.error) alert(`Erro: ${res.error}`)
      else { setEditingItem(null); setIsModalOpen(false) }
    } catch (err: any) { alert(`Erro: ${err.message}`) } finally { setSaving(false) }
  }

  const columns = [
    { header: 'Data', key: 'data', render: (i: any) => <span className="text-xs font-semibold text-slate-600">{fmtData(i.data)}</span> },
    { header: 'Descrição', key: 'descricao', render: (i: any) => (<div className="flex flex-col"><div className="flex items-center gap-2"><span className="text-sm font-bold text-slate-800">{i.descricao}</span>{i.banco_transacao_id && <span className="text-[9px] font-black bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1"><RefreshCw size={8} /> OFX</span>}</div><div className="flex gap-2"><span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{i.categoria}</span></div></div>) },
    { header: 'Valor', key: 'valor', render: (i: any) => <span className={`text-sm font-extrabold ${i.tipo === 'receita' ? 'text-emerald-600' : 'text-rose-600'}`}>{i.tipo === 'receita' ? '+' : '-'}{fmtR(i.valor)}</span> },
    { header: 'Status', key: 'status', render: (i: any) => <StatusBadge status={i.status} type="lancamento" /> },
    { header: 'Pagamento', key: 'forma_pagamento', render: (i: any) => <PaymentBadge method={i.forma_pagamento} /> },
    { header: 'Conciliação', key: 'data_conciliacao', render: (l: any) => (l.conciliado ? (<div className="flex flex-col"><span className="text-[10px] font-bold text-emerald-600">{fmtData(l.data_conciliacao)}</span><span className="text-[8px] text-emerald-400 font-medium uppercase tracking-tighter">Liquidado</span></div>) : (<span className="text-[10px] font-medium text-slate-300 italic uppercase tracking-tighter">Pendente</span>))},
    { header: '', key: 'acoes', className: 'text-right', render: (i: any) => (<div className="flex items-center justify-end gap-2 group-hover:opacity-100 opacity-0"><button onClick={() => { setEditingItem(i); setIsModalOpen(true) }} className="p-1.5 text-blue-600 bg-blue-50 rounded-lg"><Pencil size={14} /></button><button onClick={() => confirm('Excluir?') && remover(i.id)} className="p-1.5 text-red-600 bg-red-50 rounded-lg"><XCircle size={14} /></button></div>) }
  ]

  const modalFields: Field[] = useMemo(() => [
    { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [{ value: 'receita', label: 'Receita' }, { value: 'despesa', label: 'Despesa' }] },
    { name: 'data', label: 'Data', type: 'date', required: true },
    { name: 'descricao', label: 'Descrição', type: 'text', required: true },
    { name: 'valor', label: 'Valor (R$)', type: 'number', required: true },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'aberto', label: 'Provisionado' }, { value: 'pago', label: 'Efetivado (Pago)' }, { value: 'atrasado', label: 'Atrasado' }] },
    { name: 'conta_id', label: 'Conta', type: 'select', required: true, options: contas.map(c => ({ value: c.id, label: c.nome })) },
    { name: 'categoria', label: 'Categoria', type: 'select', required: true, options: categorias.map(c => ({ value: c.nome, label: c.nome })) },
    { name: 'forma_pagamento', label: 'Forma', type: 'select', options: [{ value: 'PIX', label: 'PIX' }, { value: 'Boleto', label: 'Boleto' }, { value: 'Dinheiro', label: 'Dinheiro' }, { value: 'Transferência', label: 'Transferência' }] },
    { name: 'associado_id', label: 'Associado Individual', type: 'select', showIf: (f: any) => f.tipo === 'receita', options: [{ value: '', label: 'Nenhum' }, ...associados.map(a => ({ value: a.id, label: a.nome }))] },
    { name: 'recorrencia_ativa', label: 'Ativar Recorrência?', type: 'checkbox' },
  ], [contas, categorias, associados])

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm"><BarChart2 size={24} /></div>
          <div><h1 className="text-2xl font-black text-slate-800 tracking-tight">Fluxo de Caixa</h1><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gestão Financeira Unificada</p></div>
        </div>
        <div className="flex gap-3">
           <button onClick={() => { setEditingItem({ tipo: 'receita' }); setIsModalOpen(true) }} className="px-5 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10 active:scale-95">
             <Plus size={14} strokeWidth={4} /> Receita
           </button>
           <button onClick={() => { setEditingItem({ tipo: 'despesa' }); setIsModalOpen(true) }} className="px-5 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/10 active:scale-95">
             <Plus size={14} strokeWidth={4} /> Despesa
           </button>
        </div>
      </div>

      <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('geral')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'geral' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>📊 Geral</button>
        <button onClick={() => setActiveTab('receitas')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'receitas' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>↑ Receitas</button>
        <button onClick={() => setActiveTab('despesas')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'despesas' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>↓ Despesas</button>
      </div>

      {activeTab === 'geral' && (
        <>
          <FinancialKpiGrid kpis={kpiData} onNew={() => { setEditingItem(null); setIsModalOpen(true) }} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="📊 Fluxo Mensal" subtitle="Realizado vs Projetado"><Chart type="bar" data={{ labels: MESES, datasets: [{ label: 'Receita Real', data: chartData.recReal, backgroundColor: '#10b981', borderRadius: 4, stack: '0' }, { label: 'Receita Prov.', data: chartData.recProv, backgroundColor: 'rgba(16,185,129,0.25)', borderRadius: 4, stack: '0' }, { label: 'Desp. Real', data: chartData.despReal, backgroundColor: '#f43f5e', borderRadius: 4, stack: '1' }, { label: 'Desp. Prov.', data: chartData.despProv, backgroundColor: 'rgba(244,63,94,0.25)', borderRadius: 4, stack: '1' }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 10, weight: 'bold' } } } }, scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } }} /></ChartCard>
            <ChartCard title="📈 Saldo Acumulado" subtitle="Evolução do caixa"><Line data={{ labels: MESES, datasets: [{ label: 'Saldo (R$)', data: chartData.recReal.map((v, i) => safeDiff(v, chartData.despReal[i])), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.05)', fill: true, tension: 0.4 }] }} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } }} /></ChartCard>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center gap-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 min-w-[250px]"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Buscar no fluxo..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
        <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="bg-slate-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
        <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className="bg-slate-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none"><option value={-1}>Todos Meses</option>{MESES.map((m, idx) => <option key={m} value={idx}>{m}</option>)}</select>
        <button onClick={() => setIsSyncModalOpen(true)} className="px-6 py-4 bg-slate-50 text-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-[1px] flex items-center gap-3 transition-all hover:bg-slate-100"><RefreshCw size={14} /> Recorrência em Lote</button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"><DataTable columns={columns as any} data={filteredLancamentos} loading={loading} /></div>

      <CrudModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Editar Lançamento' : 'Novo Lançamento'} initialData={editingItem} onSubmit={handleSalvar} fields={modalFields} loading={saving} />
      <CrudModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} title="Gerar Mensalidades em Lote" onSubmit={async (p: any) => {
        let list = associados.filter(a => a.status === 'ativo');
        if (p.publico_alvo === 'zapsign_new') {
          list = list.filter(a => {
            const isZapSign = (a.categoria || '').toLowerCase() === 'zapsign';
            const semRecorrencia = !lancamentos.some(l => l.associado_id === a.id && l.categoria === 'Mensalidade');
            return isZapSign && semRecorrencia;
          });
        }
        if (!list.length) return alert('Nenhum associado encontrado.');
        const batch: any[] = []; 
        list.forEach(assoc => { 
          for(let i=0; i<Number(p.meses); i++) { 
            const d = new Date(Number(p.ano_inicio), Number(p.mes_inicio)+i, Number(p.dia)); 
            batch.push({ tipo: 'receita', descricao: `${p.descricao_padrao.toUpperCase()} - ${assoc.nome.toUpperCase()}`, categoria: 'Mensalidade', valor: assoc.mensalidade || 50, data: d.toISOString().split('T')[0], status: 'aberto', associado_id: assoc.id, conta_id: p.conta_id, forma_pagamento: p.forma_pagamento }) 
          } 
        })
        const res = await inserirBulk(batch); 
        if (!res.error) { alert(`Sucesso! ${res.count} mensalidades geradas.`); setIsSyncModalOpen(false) } else alert(res.error)
      }} fields={[{ name: 'publico_alvo', label: 'Público Alvo', type: 'select', defaultValue: 'todos', options: [{ value: 'todos', label: 'Todos os Associados Ativos' }, { value: 'zapsign_new', label: 'Apenas Novos ZapSign (Sem Recorrência)' }] }, { name: 'descricao_padrao', label: 'Descrição Base', type: 'text', defaultValue: 'MENSALIDADE' }, { name: 'mes_inicio', label: 'Partir do Mês', type: 'select', defaultValue: new Date().getMonth().toString(), options: MESES.map((m, idx) => ({ value: idx.toString(), label: m })) }, { name: 'ano_inicio', label: 'Ano', type: 'number', defaultValue: new Date().getFullYear().toString() }, { name: 'dia', label: 'Dia', type: 'number', defaultValue: '10' }, { name: 'meses', label: 'Meses', type: 'select', defaultValue: '12', options: [{ value: '1', label: '1 mês' }, { value: '6', label: '6 Meses' }, { value: '12', label: '12 Meses' }] }, { name: 'forma_pagamento', label: 'Forma', type: 'select', defaultValue: 'Boleto', options: [{ value: 'PIX', label: 'PIX' }, { value: 'Boleto', label: 'Boleto' }, { value: 'Dinheiro', label: 'Dinheiro' }] }, { name: 'conta_id', label: 'Conta', type: 'select', options: contas.map(c => ({ value: c.id, label: c.nome })) } ]} />
    </div>
  )
}
