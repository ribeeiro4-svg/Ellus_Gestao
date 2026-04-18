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
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import CrudModal from '@/components/ui/CrudModal'
import PaymentBadge from '@/components/ui/PaymentBadge'
import ChartCard from '@/components/ui/ChartCard'
import { fmtR, fmtData, MESES } from '@/lib/utils/formatters'
import { Plus, BarChart2, RefreshCw, Search, Filter, XCircle, AlertCircle, TrendingUp, Users } from 'lucide-react'
import { safeSum, safeDiff } from '@/lib/utils/formatters'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler)

export default function FinanceiroPage() {
  const { lancamentos, loading, kpis, inserir, atualizar, remover, removerBulk, inserirBulk } = useFinanceiro()
  const { contas } = useContas()
  const { associados } = useAssociados()
  const { fornecedores } = useFornecedores()
  const { diretoria } = useDiretoria()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  /* ── Filtros ── */
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterPagamento, setFilterPagamento] = useState('todos')
  const [filterTipo, setFilterTipo] = useState('todos')
  const [filterMonth, setFilterMonth] = useState<number>(-1)
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())
  const [filterConta, setFilterConta] = useState('todos')
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [onlyUnlinked, setOnlyUnlinked] = useState(false)

  // Identifica associados que nunca tiveram nenhuma receita lançada
  const associadosSemPagamento = useMemo(() => {
    return associados.filter(a => 
      !lancamentos.some(l => l.associado_id === a.id && l.tipo === 'receita')
    )
  }, [associados, lancamentos])

  const handleGerarRecorrenciaParaNovos = async (params: { 
    meses: number, 
    forma_pagamento: string, 
    conta_id: string, 
    dia: number,
    mes_inicio: number,
    ano_inicio: number,
    descricao_padrao: string
  }) => {
    if (!associadosSemPagamento.length) return
    
    const batch: any[] = []
    
    associadosSemPagamento.forEach(assoc => {
      for (let i = 0; i < params.meses; i++) {
        const d = new Date(params.ano_inicio, params.mes_inicio + i, Number(params.dia))
        batch.push({
          tipo: 'receita',
          descricao: `${params.descricao_padrao.toUpperCase()} - ${assoc.nome.toUpperCase()}`,
          categoria: 'Mensalidades',
          valor: 50,
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
      alert(`${batch.length} lançamentos gerados com sucesso para ${associadosSemPagamento.length} associados!`)
      setIsSyncModalOpen(false)
    } else {
      console.error('Erro detalhado no lote:', res.error)
      alert('Erro ao gerar lançamentos. Verifique as informações ou contate o suporte.')
    }
  }

  const filteredLancamentos = useMemo(() => {
    return lancamentos.filter(l => {
      const d = new Date(l.data)
      const matchMonth = filterMonth === -1 || d.getMonth() === filterMonth
      const matchYear = d.getFullYear() === filterYear
      
      const searchLower = searchTerm.toLowerCase()
      const assoc = associados.find(a => a.id === l.associado_id)
      const conta = contas.find(c => c.id === l.conta_id)
      
      const matchSearch = !searchTerm || 
        l.descricao.toLowerCase().includes(searchLower) ||
        assoc?.nome.toLowerCase().includes(searchLower) ||
        conta?.nome.toLowerCase().includes(searchLower) ||
        l.categoria.toLowerCase().includes(searchLower)
      
      const matchStatus = filterStatus === 'todos' || l.status === filterStatus
      const matchPagamento = filterPagamento === 'todos' || l.forma_pagamento === filterPagamento
      const matchTipo = filterTipo === 'todos' || l.tipo === filterTipo
      const matchConta = filterConta === 'todos' || l.conta_id === filterConta
      const matchUnlinked = !onlyUnlinked || (!l.associado_id && !l.fornecedor_id)

      return matchMonth && matchYear && matchSearch && matchStatus && matchPagamento && matchTipo && matchConta && matchUnlinked
    })
  }, [lancamentos, searchTerm, filterStatus, filterPagamento, filterTipo, filterMonth, filterYear, filterConta, onlyUnlinked, associados, contas])

  /* ── Dados para gráficos ── */
  const { recReal, recProv, despReal, despProv } = useMemo(() => {
    const rR = Array(12).fill(0), rP = Array(12).fill(0)
    const dR = Array(12).fill(0), dP = Array(12).fill(0)
    
    // Usamos lancamentos (sem filtros de status p/ gráfico completo)
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
  
  const recAcumReal = useMemo(() => {
    return recReal.reduce<number[]>((arr, v) => { arr.push(safeSum(arr[arr.length - 1] || 0, v)); return arr }, [])
  }, [recReal])

  // KPIs dinâmicas baseadas no ANO selecionado
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
          oExp = safeSum(oExp, v)
        }
      }
    })
    return {
      realizado: safeDiff(pInc, pExp),
      provisionado: safeDiff(oInc, oExp),
      projetado: safeSum(safeDiff(pInc, pExp), safeDiff(oInc, oExp)),
      saldoCaixa: fCash,
      saldoBanco: fBank
    }
  }, [lancamentos, filterYear])

  const margens = recReal.map((v, i) => v > 0 ? Math.round((v - despReal[i]) / v * 100) : 0)

  /* ── CRUD helpers ── */
  const handleSalvar = async (data: any) => {
    const safeData = {
      ...data,
      associado_id: data.associado_id || null,
      fornecedor_id: data.fornecedor_id || null,
      diretor_id: data.diretor_id || null,
      conta_id: data.conta_id || null
    }

    if (editingItem) { 
      await atualizar(editingItem.id, safeData) 
    } 
    else { 
      if (safeData.recorrencia_ativa) {
        const mesesAFrente = Number(safeData.recorrencia_meses || 12)
        const batch: any[] = []
        const { recorrencia_ativa, recorrencia_meses, valor_recebido, troco_via_pix, ...dbData } = safeData;

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
          
          batch.push({ ...dbData, data: dataString, status: i === 0 ? (safeData.status || 'aberto') : 'aberto' });
        }
        await inserirBulk(batch);
      } else {
        const { recorrencia_ativa, recorrencia_meses, valor_recebido, troco_via_pix, ...dbData } = safeData;
        await inserir({ ...dbData, status: safeData.status || 'aberto' });
      }
    }
    setEditingItem(null);
    setIsModalOpen(false);
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

  const fontSm = { size: 10 }
  const gridFaint = { color: 'rgba(0,0,0,.04)' }

  /* ── Colunas ── */
  const columns = [
    { 
      header: <input type="checkbox" checked={selectedIds.size === filteredLancamentos.length && filteredLancamentos.length > 0} onChange={toggleSelectAll} className="rounded" />,
      key: 'select', className: 'w-10',
      render: (i: any) => <input type="checkbox" checked={selectedIds.has(i.id)} onChange={() => toggleSelect(i.id)} className="rounded" />
    },
    { header: 'Data', key: 'data', render: (i: any) => <span className="text-xs font-medium text-gray-500">{fmtData(i.data)}</span> },
    {
      header: 'Descrição', key: 'descricao', render: (i: any) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-800">{i.descricao}</span>
            {i.banco_transacao_id && (
              <span className="text-[9px] font-black bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1 shadow-sm">
                <RefreshCw size={8} /> OFX
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase">{i.categoria}</span>
            {i.recorrencia_ativa && <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1 rounded uppercase tracking-tighter">RECORRENTE</span>}
          </div>
        </div>
      )
    },
    {
      header: 'Conta', key: 'conta_id', render: (i: any) => {
        const c = contas.find(ca => ca.id === i.conta_id)
        return <span className="text-[11px] font-bold text-gray-400 uppercase">{c?.nome || '--'}</span>
      }
    },
    {
      header: 'Tipo', key: 'tipo', render: (i: any) => (
        <span className={`status-badge ${i.tipo === 'receita' ? 'status-ativo' : 'status-inadimplente'}`}>
          {i.tipo === 'receita' ? '↑ Receita' : '↓ Despesa'}
        </span>
      )
    },
    {
      header: 'Valor', key: 'valor', render: (i: any) => (
        <span className={`text-sm font-extrabold ${i.tipo === 'receita' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {i.tipo === 'receita' ? '+' : '-'}{fmtR(i.valor)}
        </span>
      )
    },
    { header: 'Status', key: 'status', render: (i: any) => <StatusBadge status={i.status} type="lancamento" /> },
    { header: 'Pagamento', key: 'forma_pagamento', render: (i: any) => <PaymentBadge method={i.forma_pagamento} /> },
    {
      header: '', key: 'acoes', className: 'w-20 text-right',
      render: (i: any) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => handleEdit(i)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
          </button>
          <button onClick={() => handleDelete(i.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <BarChart2 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">Fluxo de Caixa</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gestão de Realizado e Provisionamento</p>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { label: `📟 Em Caixa (${filterYear})`, value: fmtR(filteredKpis.saldoCaixa), color: filteredKpis.saldoCaixa >= 0 ? 'text-amber-600' : 'text-red-600' },
            { label: `🏦 Em Banco (${filterYear})`, value: fmtR(filteredKpis.saldoBanco), color: filteredKpis.saldoBanco >= 0 ? 'text-indigo-600' : 'text-red-600' },
            { label: `💰 Realizado (${filterYear})`, value: fmtR(filteredKpis.realizado), color: filteredKpis.realizado >= 0 ? 'text-emerald-600' : 'text-rose-600' },
            { label: `📅 Provisionado (${filterYear})`, value: fmtR(filteredKpis.provisionado), color: 'text-gray-500' },
            { label: `📊 Projetado (${filterYear})`, value: fmtR(filteredKpis.projetado), color: 'text-indigo-900', isMain: true },
          ].map(k => (
            <div key={k.label} className={`bg-white border border-gray-100 rounded-2xl p-3 min-w-[150px] shadow-sm flex-shrink-0 ${k.isMain ? 'ring-2 ring-indigo-50 border-indigo-100' : ''}`}>
              <div className="text-[9px] font-black text-gray-400 uppercase mb-1">{k.label}</div>
              <div className={`text-sm font-black ${k.color}`}>{k.value}</div>
            </div>
          ))}
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true) }} className="ml-2 px-6 py-4 bg-gray-900 text-white rounded-2xl font-bold text-xs hover:bg-black transition-all shadow-lg shadow-gray-200 flex items-center gap-2 flex-shrink-0">
            <Plus size={16} /> Novo Lançamento
          </button>
        </div>
      </div>

      {/* ── Gráficos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="📊 Fluxo Mensal: Realizado vs Projetado" subtitle="Barras sólidas (Realizado) | Opacas (Provisionado)">
          <Chart
            type="bar"
            data={{
              labels: MESES,
              datasets: [
                { label: 'Receita Real', data: recReal, backgroundColor: '#10b981', borderRadius: 4, stack: 'Stack 0' },
                { label: 'Receita Prov.', data: recProv, backgroundColor: 'rgba(16,185,129,0.25)', borderRadius: 4, stack: 'Stack 0' },
                { label: 'Despesa Real', data: despReal, backgroundColor: '#f43f5e', borderRadius: 4, stack: 'Stack 1' },
                { label: 'Despesa Prov.', data: despProv, backgroundColor: 'rgba(244,63,94,0.25)', borderRadius: 4, stack: 'Stack 1' },
                { type: 'line', label: 'Projeção Saldo', data: resultMensalProjetado, borderColor: '#6366f1', borderWidth: 2, pointRadius: 0, tension: 0.4, fill: false }
              ]
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 10, weight: 'bold' } } } },
              scales: {
                y: { grid: { color: '#f8fafc' }, ticks: { callback: (v) => 'R$ ' + v } },
                x: { grid: { display: false } }
              }
            }}
          />
        </ChartCard>

        <ChartCard title="📈 Acumulado Projetado" subtitle="Evolução do caixa considerando provisões">
          <Line
            data={{
              labels: MESES,
              datasets: [
                { label: 'Saldo Acumulado', data: recAcumReal, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.05)', fill: true, tension: 0.4 },
                { label: 'Margem %', data: margens, borderColor: '#f59e0b', borderDash: [5, 5], yAxisID: 'y2', tension: 0.4 }
              ]
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              scales: {
                y: { grid: { color: '#f8fafc' } },
                y2: { position: 'right', max: 100, min: 0, ticks: { callback: (v) => v + '%' } }
              }
            }}
          />
        </ChartCard>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
          <input 
            type="text" placeholder="Buscar lançamentos..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl text-sm border-none focus:ring-2 ring-indigo-100 transition-all font-medium"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-gray-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none">
          <option value="todos">Todos Status</option>
          <option value="pago">Pago</option>
          <option value="aberto">Provisionado</option>
          <option value="atrasado">Atrasado</option>
        </select>
        <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="bg-gray-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none hover:bg-white transition-all">
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterConta} onChange={e => setFilterConta(e.target.value)} className="bg-gray-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none hover:bg-white transition-all">
          <option value="todos">Todas Contas</option>
          {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="bg-gray-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none hover:bg-white transition-all">
          <option value="todos">Todos Tipos</option>
          <option value="receita">Apenas Receitas</option>
          <option value="despesa">Apenas Despesas</option>
        </select>
        <select value={filterPagamento} onChange={e => setFilterPagamento(e.target.value)} className="bg-gray-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none hover:bg-white transition-all">
          <option value="todos">Todos Pagamentos</option>
          <option value="PIX">PIX</option>
          <option value="Boleto">Boleto</option>
          <option value="Cartão">Cartão</option>
          <option value="Dinheiro">Dinheiro</option>
          <option value="Transferência">Transferência</option>
        </select>
        {associadosSemPagamento.length > 0 && (
          <button onClick={() => setIsSyncModalOpen(true)} className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-xs font-bold hover:bg-indigo-100 transition-all">
            Sincronizar Novos ({associadosSemPagamento.length})
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable columns={columns as any} data={filteredLancamentos} loading={loading} />
      </div>

      <CrudModal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Lançamento' : 'Novo Lançamento'}
        initialData={editingItem} onSubmit={handleSalvar}
        fields={[
          { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [{ value: 'receita', label: 'Receita' }, { value: 'despesa', label: 'Despesa' }] },
          { name: 'descricao', label: 'Descrição', type: 'text', required: true },
          { name: 'valor', label: 'Valor (R$)', type: 'number', required: true },
          { name: 'data', label: 'Data', type: 'date', required: true },
          { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'pago', label: 'Pago' }, { value: 'aberto', label: 'Provisionado' }, { value: 'atrasado', label: 'Atrasado' }] },
          { name: 'conta_id', label: 'Conta', type: 'select', required: true, options: contas.map(c => ({ value: c.id, label: c.nome })) },
          { name: 'categoria', label: 'Categoria', type: 'text', required: true },
          { name: 'forma_pagamento', label: 'Forma', type: 'select', options: [{ value: 'PIX', label: 'PIX' }, { value: 'Boleto', label: 'Boleto' }, { value: 'Dinheiro', label: 'Dinheiro' }] },
          { name: 'recorrencia_ativa', label: 'Ativar Recorrência?', type: 'checkbox' },
          { name: 'recorrencia_meses', label: 'Meses', type: 'number', showIf: (f) => f.recorrencia_ativa },
          { name: 'associado_id', label: 'Associado', type: 'select', showIf: (f) => f.tipo === 'receita', options: [{ value: '', label: 'Nenhum' }, ...associados.map(a => ({ value: a.id, label: a.nome }))] },
        ]}
      />

      <CrudModal 
        isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)}
        title="Sincronizar Novos Associados" onSubmit={handleGerarRecorrenciaParaNovos}
        fields={[
          { name: 'descricao_padrao', label: 'Descrição', type: 'text', defaultValue: 'MENSALIDADE' },
          { name: 'mes_inicio', label: 'Mês Início', type: 'select', defaultValue: new Date().getMonth().toString(), options: MESES.map((m, idx) => ({ value: idx.toString(), label: m })) },
          { name: 'ano_inicio', label: 'Ano Início', type: 'number', defaultValue: new Date().getFullYear().toString() },
          { name: 'dia', label: 'Dia Vencimento', type: 'number', defaultValue: '10' },
          { name: 'meses', label: 'Quantidade Meses', type: 'select', defaultValue: '12', options: [{ value: '12', label: '12 Meses' }, { value: '24', label: '24 Meses' }] },
          { name: 'conta_id', label: 'Conta Débito', type: 'select', options: contas.map(c => ({ value: c.id, label: c.nome })) },
        ]}
      />
    </div>
  )
}
