'use client'
import React, { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
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
import { fmtR, fmtData, MESES } from '@/lib/utils/formatters'
import { Plus, Pencil, BarChart2, RefreshCw, Search, XCircle, TrendingUp, DollarSign, ArrowUpCircle, Activity, Target } from 'lucide-react'
import { safeSum, safeDiff } from '@/lib/utils/formatters'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler)

export default function FinanceiroPage() {
  const { lancamentos, loading, kpis, inserir, atualizar, remover, removerBulk, inserirBulk, atualizarBulk } = useFinanceiro()
  const { contas } = useContas()
  const { associados } = useAssociados()
  const { fornecedores } = useFornecedores()
  const { diretoria } = useDiretoria()
  const { categorias } = useCategorias()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  /* ── Filtros ── */
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState('todos')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterPagamento, setFilterPagamento] = useState('todos')
  const [filterConta, setFilterConta] = useState('todos')
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth())
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)

  // Identifica associados que nunca tiveram nenhuma receita lançada
  const associadosSemPagamento = useMemo(() => {
    return associados.filter(a => 
      !lancamentos.some(l => l.associado_id === a.id && l.tipo === 'receita')
    )
  }, [associados, lancamentos])

  const handleGerarRecorrenciaLote = async (params: { 
    meses: number, 
    forma_pagamento: string, 
    conta_id: string, 
    dia: number,
    mes_inicio: number,
    ano_inicio: number,
    descricao_padrao: string,
    target: 'todos' | 'novos' | 'selecionados'
  }) => {
    const list = params.target === 'novos' ? associadosSemPagamento : 
                 params.target === 'selecionados' ? associados.filter(a => selectedIds.has(a.id)) :
                 associados.filter(a => a.status === 'ativo')

    if (!list.length) {
      alert('Nenhum associado encontrado para os critérios selecionados.')
      return
    }
    
    const batch: any[] = []
    
    list.forEach(assoc => {
      for (let i = 0; i < Number(params.meses); i++) {
        const d = new Date(Number(params.ano_inicio), Number(params.mes_inicio) + i, Number(params.dia))
        batch.push({
          tipo: 'receita',
          descricao: `${params.descricao_padrao.toUpperCase()} - ${assoc.nome.toUpperCase()}`,
          categoria: 'Mensalidade',
          valor: assoc.mensalidade || 50,
          data: d.toISOString().split('T')[0],
          status: 'aberto',
          associado_id: assoc.id,
          conta_id: params.conta_id,
          forma_pagamento: params.forma_pagamento
        })
      }
    })

    const res = await inserirBulk(batch)
    if (!res.error) {
      alert(`Sucesso! ${res.count || batch.length} lançamentos gerados para ${list.length} associados.`)
      setIsSyncModalOpen(false)
      setSelectedIds(new Set())
    } else {
      alert(`Aviso: ${res.error}`)
    }
  }

  const filteredLancamentos = useMemo(() => {
    return lancamentos.filter(item => {
      const d = new Date(item.data)
      const matchMonth = filterMonth === -1 || d.getMonth() === filterMonth
      const matchYear = d.getFullYear() === filterYear
      
      const matchTipo = filterTipo === 'todos' || item.tipo === filterTipo
      const matchPagamento = filterPagamento === 'todos' || item.forma_pagamento === filterPagamento
      const matchConta = filterConta === 'todos' || item.conta_id === filterConta
      const matchStatus = filterStatus === 'todos' || item.status === filterStatus
      
      const matchSearch = 
        item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categoria.toLowerCase().includes(searchTerm.toLowerCase())

      return matchYear && matchMonth && matchTipo && matchPagamento && matchConta && matchStatus && matchSearch
    })
  }, [lancamentos, filterYear, filterMonth, filterTipo, filterPagamento, filterConta, filterStatus, searchTerm])

  /* ── Dados para gráficos ── */
  const { recReal, recProv, despReal, despProv } = useMemo(() => {
    const rR = Array(12).fill(0), rP = Array(12).fill(0)
    const dR = Array(12).fill(0), dP = Array(12).fill(0)
    
    lancamentos.forEach(l => {
      const d = new Date(l.data)
      if (d.getFullYear() !== filterYear) return
      const m = d.getMonth()
      if (isNaN(m)) return
      
      const v = l.valor || 0
      const isPago = l.status === 'pago'

      if (l.tipo === 'receita') {
        if (isPago) rR[m] = safeSum(rR[m], v)
        else rP[m] = safeSum(rP[m], v)
      } else {
        if (isPago) dR[m] = safeSum(dR[m], v)
        else dP[m] = safeSum(dP[m], v)
      }
    })
    return { recReal: rR, recProv: rP, despReal: dR, despProv: dP }
  }, [lancamentos, filterYear])

  const resultMensalReal = recReal.map((v, i) => safeDiff(v, despReal[i]))
  const resultMensalProjetado = recReal.map((v, i) => safeDiff(safeSum(v, recProv[i]), safeSum(despReal[i], despProv[i])))
  
  const resultAcumReal = useMemo(() => {
    return resultMensalReal.reduce<number[]>((arr, v) => { arr.push(safeSum(arr[arr.length - 1] || 0, v)); return arr }, [])
  }, [resultMensalReal])

  const filteredKpis = useMemo(() => {
    let pInc = 0, pExp = 0, oInc = 0, oExp = 0
    let fCash = 0, fBank = 0

    lancamentos.forEach(l => {
      const d = new Date(l.data)
      if (d.getFullYear() !== filterYear) return
      
      const v = l.valor || 0
      const isPago = l.status === 'pago'
      
      if (l.tipo === 'receita') {
        if (isPago) {
          pInc = safeSum(pInc, v)
          if (l.forma_pagamento === 'Dinheiro') fCash = safeSum(fCash, v)
          else fBank = safeSum(fBank, v)
        } else {
          oInc = safeSum(oInc, v)
        }
      } else {
        if (isPago) {
          pExp = safeSum(pExp, v)
          if (l.forma_pagamento === 'Dinheiro') fCash = safeDiff(fCash, v)
          else fBank = safeDiff(fBank, v)
        } else {
          oExp = safeDiff(oExp, v)
        }
      }
    })
    return {
      pInc, pExp,
      realizado: safeDiff(pInc, pExp),
      provisionado: safeDiff(oInc, oExp),
      projetado: safeSum(safeDiff(pInc, pExp), safeDiff(oInc, oExp)),
      saldoCaixa: fCash,
      saldoBanco: fBank
    }
  }, [lancamentos, filterYear])

  const margens = recReal.map((v, i) => v > 0 ? Math.round((v - despReal[i]) / v * 100) : 0)

  const handleSalvar = async (data: any) => {
    const safeData = {
      ...data,
      valor: Number(data.valor),
      associado_id: data.associado_id || null,
      fornecedor_id: data.fornecedor_id || null,
      diretor_id: data.diretor_id || null,
      conta_id: data.conta_id || null
    }

    setSaving(true)
    try {
      let res
      if (editingItem) { 
        res = await atualizar(editingItem.id, safeData) 
      } 
      else { 
        const { is_lote, selected_associados, recorrencia_ativa, recorrencia_meses, ...dbData } = safeData;
        
        if (is_lote && selected_associados?.length > 0) {
          const batch: any[] = []
          selected_associados.forEach((assocId: string) => {
            const assoc = associados.find(a => a.id === assocId)
            batch.push({ 
              ...dbData, 
              descricao: `${dbData.descricao.toUpperCase()} - ${assoc?.nome.toUpperCase() || 'LOTE'}`,
              associado_id: assocId, 
              status: safeData.status || 'aberto' 
            })
          })
          res = await inserirBulk(batch)
        } else if (safeData.recorrencia_ativa) {
          const mesesAFrente = Number(safeData.recorrencia_meses || 12)
          const batch: any[] = []
          const assoc = safeData.associado_id ? associados.find(a => a.id === safeData.associado_id) : null;
          const finalDesc = assoc ? `${dbData.descricao.toUpperCase()} - ${assoc.nome.toUpperCase()}` : dbData.descricao.toUpperCase();

          for (let i = 0; i <= mesesAFrente; i++) {
            const parts = safeData.data.includes('-') 
              ? safeData.data.split('-').map(Number)
              : safeData.data.split('/').reverse().map(Number);
            const targetMonth = parts[1] - 1 + i;
            const targetYear = parts[0];
            const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
            const finalDay = Math.min(parts[2], lastDay);
            const d = new Date(targetYear, targetMonth, finalDay);
            const dataString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            batch.push({ ...dbData, descricao: finalDesc, data: dataString, status: i === 0 ? (safeData.status || 'aberto') : 'aberto' });
          }
          res = await inserirBulk(batch);
        } else {
          const assoc = safeData.associado_id ? associados.find(a => a.id === safeData.associado_id) : null;
          const finalDesc = assoc ? `${dbData.descricao.toUpperCase()} - ${assoc.nome.toUpperCase()}` : dbData.descricao.toUpperCase();
          
          const itemsToInsert = [];
          
          // Prepara a receita principal
          itemsToInsert.push({ 
            ...dbData, 
            descricao: finalDesc, 
            status: safeData.status || 'aberto' 
          });

          // Se houver troco em PIX, prepara a despesa automática
          if (safeData.troco_via_pix && Number(safeData.valor_troco) > 0) {
              itemsToInsert.push({
                  tipo: 'despesa' as const,
                  descricao: `TROCO EM PIX - ${assoc?.nome.toUpperCase() || 'CLIENTE'}`,
                  valor: Number(safeData.valor_troco),
                  data: dbData.data,
                  status: 'pago' as const,
                  conta_id: dbData.conta_id,
                  categoria: 'TROCO',
                  forma_pagamento: 'PIX'
              });
          }
          
          res = await inserirBulk(itemsToInsert);
        }
      }

      if (res?.error) {
        alert(`Erro ao salvar: ${res.error}`)
      } else {
        setEditingItem(null)
        setIsModalOpen(false)
      }
    } catch (err: any) {
      alert(`Erro inesperado: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este lançamento?')) await remover(id)
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (confirm(`Deseja excluir ${selectedIds.size} lançamentos?`)) {
      await removerBulk(Array.from(selectedIds))
      setSelectedIds(new Set())
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLancamentos.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filteredLancamentos.map(l => l.id)))
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleEdit = (item: any) => { setEditingItem(item); setIsModalOpen(true) }

  const columns = [
    { 
      header: <input type="checkbox" checked={selectedIds.size === filteredLancamentos.length && filteredLancamentos.length > 0} onChange={toggleSelectAll} className="rounded" />,
      key: 'select', className: 'w-10',
      render: (i: any) => <input type="checkbox" checked={selectedIds.has(i.id)} onChange={() => toggleSelect(i.id)} className="rounded" />
    },
    { header: 'Data', key: 'data', render: (i: any) => <span className="text-xs font-medium text-slate-500">{fmtData(i.data)}</span> },
    {
      header: 'Descrição', key: 'descricao', render: (i: any) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">{i.descricao}</span>
            {i.banco_transacao_id && (
              <span className="text-[9px] font-black bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1 shadow-sm"><RefreshCw size={8} /> OFX</span>
            )}
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{i.categoria}</span>
            {i.recorrencia_ativa && <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1 rounded uppercase tracking-tighter">RECORRENTE</span>}
          </div>
        </div>
      )
    },
    {
      header: 'Conta', key: 'conta_id', render: (i: any) => {
        const c = contas.find(ca => ca.id === i.conta_id)
        return <span className="text-[11px] font-bold text-slate-400 uppercase">{c?.nome || '--'}</span>
      }
    },
    {
      header: 'Tipo', key: 'tipo', render: (i: any) => (
        <span className={`status-badge ${i.tipo === 'receita' ? 'status-ativo' : 'status-inadimplente'}`}>{i.tipo === 'receita' ? '↑ Receita' : '↓ Despesa'}</span>
      )
    },
    {
      header: 'Valor', key: 'valor', render: (i: any) => (
        <span className={`text-sm font-extrabold ${i.tipo === 'receita' ? 'text-emerald-600' : 'text-rose-600'}`}>{i.tipo === 'receita' ? '+' : '-'}{fmtR(i.valor)}</span>
      )
    },
    { header: 'Status', key: 'status', render: (i: any) => <StatusBadge status={i.status} type="lancamento" /> },
    { header: 'Pagamento', key: 'forma_pagamento', render: (i: any) => <PaymentBadge method={i.forma_pagamento} /> },
    {
      header: '', key: 'acoes', className: 'w-20 text-right',
      render: (i: any) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => handleEdit(i)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"><Pencil size={14} /></button>
          <button onClick={() => handleDelete(i.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"><XCircle size={14} /></button>
        </div>
      )
    }
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
    { name: 'recorrente', label: 'Ativar Recorrência?', type: 'checkbox' },
    { name: 'associado_id', label: 'Associado Individual', type: 'select', showIf: (f: any) => f.tipo === 'receita', options: [{ value: '', label: 'Nenhum' }, ...associados.map(a => ({ value: a.id, label: a.nome }))] },
    { name: 'troco_pix', label: 'Troco via PIX?', type: 'checkbox', showIf: (f: any) => f.tipo === 'receita' },
    { name: 'em_lote', label: 'Lançar em Lote?', type: 'checkbox', showIf: (f: any) => f.tipo === 'receita' && !editingItem },
  ], [contas, categorias, associados, editingItem])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm"><BarChart2 size={24} /></div>
          <div><h1 className="text-2xl font-black text-slate-800 tracking-tight">Fluxo de Caixa</h1><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gestão de Realizado e Provisionamento</p></div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {[
            { label: `📥 Receitas (${filterYear})`, value: fmtR(filteredKpis.pInc), color: 'text-emerald-600' },
            { label: `📤 Despesas (${filterYear})`, value: fmtR(filteredKpis.pExp), color: 'text-rose-600' },
            { label: `📅 Provisionado (${filterYear})`, value: fmtR(filteredKpis.provisionado), color: 'text-amber-500' },
            { label: `💰 Resultado (${filterYear})`, value: fmtR(filteredKpis.realizado), color: filteredKpis.realizado >= 0 ? 'text-indigo-600' : 'text-red-600' },
            { label: `📟 Em Caixa (${filterYear})`, value: fmtR(filteredKpis.saldoCaixa), color: 'text-amber-600' },
            { label: `🏦 Em Banco (${filterYear})`, value: fmtR(filteredKpis.saldoBanco), color: 'text-indigo-600' },
            { label: `📊 Projetado (${filterYear})`, value: fmtR(filteredKpis.projetado), color: 'text-indigo-900', isMain: true },
          ].map(k => (
            <div key={k.label} className={`bg-white border border-slate-100 rounded-2xl p-3 min-w-[150px] shadow-sm flex-shrink-0 ${k.isMain ? 'ring-2 ring-indigo-50 border-indigo-100' : ''}`}><div className="text-[9px] font-black text-slate-400 uppercase mb-1">{k.label}</div><div className={`text-sm font-black ${k.color}`}>{k.value}</div></div>
          ))}
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true) }} className="ml-2 btn btn-primary" style={{ padding: '12px 24px', fontSize: 13 }}><Plus size={16} /> Novo Lançamento</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="📊 Fluxo Mensal" subtitle="Realizado vs Projetado">
          <Chart type="bar" data={{ labels: MESES, datasets: [{ label: 'Receita Real', data: recReal, backgroundColor: '#10b981', borderRadius: 4, stack: 'Stack 0' }, { label: 'Receita Prov.', data: recProv, backgroundColor: 'rgba(16,185,129,0.25)', borderRadius: 4, stack: 'Stack 0' }, { label: 'Despesa Real', data: despReal, backgroundColor: '#f43f5e', borderRadius: 4, stack: 'Stack 1' }, { label: 'Despesa Prov.', data: despProv, backgroundColor: 'rgba(244,63,94,0.25)', borderRadius: 4, stack: 'Stack 1' }, { type: 'line', label: 'Projeção Saldo', data: resultMensalProjetado, borderColor: '#6366f1', borderWidth: 2, pointRadius: 0, tension: 0.4, fill: false }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 10, weight: 'bold' } } } }, scales: { y: { grid: { color: '#f8fafc' }, ticks: { callback: (v) => 'R$ ' + v } }, x: { grid: { display: false } } } }} />
        </ChartCard>
        <ChartCard title="📈 Acumulado Projetado" subtitle="Evolução do caixa">
          <Line data={{ labels: MESES, datasets: [{ label: 'Saldo Acumulado (R$)', data: resultAcumReal, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.05)', fill: true, tension: 0.4 }, { label: 'Margem %', data: margens, borderColor: '#f59e0b', borderDash: [5, 5], yAxisID: 'y2', tension: 0.4 }] }} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: '#f8fafc' } }, y2: { position: 'right', max: 100, min: 0, ticks: { callback: (v) => v + '%' } } } }} />
        </ChartCard>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm mb-6">
        <div className="relative flex-1 min-w-[250px]"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Buscar no financeiro..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 ring-emerald-100 transition-all font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
        <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="bg-slate-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
        <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className="bg-slate-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none"><option value={-1}>Todos Meses</option>{MESES.map((m, idx) => <option key={m} value={idx}>{m}</option>)}</select>
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="bg-slate-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none"><option value="todos">Todos Tipos</option><option value="receita">Receitas</option><option value="despesa">Despesas</option></select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none"><option value="todos">Todos Status</option><option value="pago">Pago/Recebido</option><option value="pendente">Pendente</option></select>
        <select value={filterPagamento} onChange={e => setFilterPagamento(e.target.value)} className="bg-slate-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none"><option value="todos">Pagamento</option><option value="PIX">PIX</option><option value="Boleto">Boleto</option><option value="Cartão">Cartão</option><option value="Dinheiro">Dinheiro</option></select>
        <select value={filterConta} onChange={e => setFilterConta(e.target.value)} className="bg-slate-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none"><option value="todos">Todas Contas</option>{contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
        <button onClick={() => setIsSyncModalOpen(true)} className="px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-black transition-all flex items-center gap-2"><RefreshCw size={14} /> Recorrência em Lote</button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"><DataTable columns={columns as any} data={filteredLancamentos} loading={loading} /></div>

      <CrudModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Editar Lançamento' : 'Novo Lançamento'} initialData={editingItem} onSubmit={handleSalvar} fields={modalFields} />
      <CrudModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} title="Gerar Mensalidades em Lote" onSubmit={handleGerarRecorrenciaLote} fields={[
        { name: 'target', label: 'Quem?', type: 'select', defaultValue: selectedIds.size > 0 ? 'selecionados' : 'novos', options: [{ value: 'novos', label: 'Novos Associados' }, { value: 'todos', label: 'Todos Ativos' }, { value: 'selecionados', label: 'Selecionados' }] },
        { name: 'descricao_padrao', label: 'Descrição Base', type: 'text', defaultValue: 'MENSALIDADE' },
        { name: 'mes_inicio', label: 'Partir do Mês', type: 'select', defaultValue: new Date().getMonth().toString(), options: MESES.map((m, idx) => ({ value: idx.toString(), label: m })) },
        { name: 'ano_inicio', label: 'Ano', type: 'number', defaultValue: new Date().getFullYear().toString() },
        { name: 'dia', label: 'Dia', type: 'number', defaultValue: '10' },
        { name: 'meses', label: 'Meses', type: 'select', defaultValue: '12', options: [{ value: '1', label: '1 mês' }, { value: '6', label: '6 Meses' }, { value: '12', label: '12 Meses' }] },
        { name: 'forma_pagamento', label: 'Forma', type: 'select', defaultValue: 'Boleto', options: [{ value: 'PIX', label: 'PIX' }, { value: 'Boleto', label: 'Boleto' }, { value: 'Dinheiro', label: 'Dinheiro' }] },
        { name: 'conta_id', label: 'Conta', type: 'select', options: contas.map(c => ({ value: c.id, label: c.nome })) }
      ]} />
    </div>
  )
}
