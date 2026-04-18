'use client'
import React, { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { useContas } from '@/lib/hooks/useContas'
import { useAssociados } from '@/lib/hooks/useAssociados'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import CrudModal, { Field } from '@/components/ui/CrudModal'
import PaymentBadge from '@/components/ui/PaymentBadge'
import ChartCard from '@/components/ui/ChartCard'
import { fmtR, fmtData, MESES } from '@/lib/utils/formatters'
import { TrendingUp, Plus, RefreshCw, Copy, Search, Filter, XCircle, AlertCircle, TrendingDown, Check, Pencil, Trash2 } from 'lucide-react'
import BatchActionBar from '@/components/ui/BatchActionBar'
import LaunchDetailsModal from '@/components/ui/LaunchDetailsModal'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler)

const CHART_COLORS = ['#34d399', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#ec4899']

const axisDefaults = {
  y: {
    grid: { color: 'rgba(0,0,0,.04)' },
    ticks: { font: { size: 10 }, callback: (v: any) => 'R$' + Math.round(Number(v) / 1000) + 'k' },
  },
  x: { grid: { display: false }, ticks: { font: { size: 10 } } },
}

export default function ReceitasPage() {
  const { 
    lancamentos, loading, inserir, atualizar, remover, 
    inserirBulk, removerSerie, atualizarSerie, atualizarBulk, removerBulk
  } = useFinanceiro()
  const { contas } = useContas()
  const { associados } = useAssociados()
  
  const receitas = useMemo(() => lancamentos.filter(l => l.tipo === 'receita'), [lancamentos])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [batchSearch, setBatchSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedForDetail, setSelectedForDetail] = useState<any | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  /* ── Filtros ── */
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterPagamento, setFilterPagamento] = useState('todos')
  const [filterConta, setFilterConta] = useState('todos')
  const [filterCategoria, setFilterCategoria] = useState('todos')
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth())
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())
  const [onlyUnlinked, setOnlyUnlinked] = useState(false)

  const filteredReceitas = useMemo(() => {
    return receitas.filter(r => {
      const dt = new Date(r.data)
      const matchMonth = filterMonth === -1 || dt.getMonth() === filterMonth
      const matchYear = dt.getFullYear() === filterYear
      const searchLower = searchTerm.toLowerCase()
      const associado = associados.find(a => a.id === r.associado_id)
      const conta = contas.find(c => c.id === r.conta_id)
      const matchSearch = !searchTerm || 
        r.descricao.toLowerCase().includes(searchLower) ||
        associado?.nome.toLowerCase().includes(searchLower) ||
        conta?.nome.toLowerCase().includes(searchLower) ||
        r.categoria.toLowerCase().includes(searchLower)
      const matchStatus = filterStatus === 'todos' || r.status === filterStatus
      const matchPagamento = filterPagamento === 'todos' || r.forma_pagamento === filterPagamento
      const matchConta = filterConta === 'todos' || r.conta_id === filterConta
      const matchCategoria = filterCategoria === 'todos' || r.categoria === filterCategoria
      const matchUnlinked = !onlyUnlinked || (!r.associado_id && !r.diretor_id)
      
      return matchMonth && matchYear && matchSearch && matchStatus && matchPagamento && matchConta && matchCategoria && matchUnlinked
    })
  }, [receitas, searchTerm, filterStatus, filterPagamento, filterConta, filterCategoria, filterMonth, filterYear, onlyUnlinked, associados, contas])

  /* ── Gráficos ── */
  const receitaMensal = useMemo(() => {
    const arr = Array(12).fill(0)
    filteredReceitas.forEach(r => {
      const m = new Date(r.data).getMonth()
      if (!isNaN(m)) arr[m] += r.valor || 0
    })
    return arr
  }, [filteredReceitas])

  const receitaCats = useMemo(() => {
    const m: Record<string, number> = {}
    filteredReceitas.forEach(r => { const c = r.categoria || 'Outros'; m[c] = (m[c] || 0) + (r.valor || 0) })
    return Object.keys(m).length ? m : { 'Sem dados': 1 }
  }, [filteredReceitas])

  const totalReceitas = filteredReceitas.reduce((s, r) => s + (r.valor || 0), 0)

  /* ── CRUD helpers ── */
  const handleSalvar = async (data: any) => {
    const cleanData = { ...data, tipo: 'receita' }
    
    if (editingItem) { 
      if (editingItem.recorrencia_id) {
        const updateSeries = confirm('Este lançamento faz parte de uma recorrência. Deseja aplicar as alterações a TODA a série?')
        if (updateSeries) {
          // Na atualização de série, removemos campos que não devem ser replicados (como data específica)
          const { data: _d, ...serieData } = cleanData
          await atualizarSerie(editingItem.recorrencia_id, serieData) 
        } else {
          await atualizar(editingItem.id, cleanData)
        }
      } else {
        await atualizar(editingItem.id, cleanData) 
      }
    } else {
      const { is_lote, selected_associados, recorrencia_ativa, recorrencia_meses, ...dbData } = cleanData;
      
      if (is_lote && selected_associados?.length > 0) {
        const batch: any[] = []
        selected_associados.forEach((assocId: string) => {
          const assoc = associados.find(a => a.id === assocId)
          batch.push({ 
            ...dbData, 
            tipo: 'receita',
            descricao: `${dbData.descricao.toUpperCase()} - ${assoc?.nome.toUpperCase() || 'LOTE'}`,
            associado_id: assocId, 
            status: dbData.status || 'pago' 
          })
        })
        await inserirBulk(batch)
      } else if (recorrencia_ativa) {
        const meses = Number(recorrencia_meses || 12)
        const batch: any[] = []
        const assoc = dbData.associado_id ? associados.find(a => a.id === dbData.associado_id) : null;
        const baseDesc = assoc ? `${dbData.descricao.toUpperCase()} - ${assoc.nome.toUpperCase()}` : dbData.descricao.toUpperCase();
        const serieId = crypto.randomUUID();

        for (let i = 0; i <= meses; i++) {
          const parts = dbData.data.includes('-') ? dbData.data.split('-').map(Number) : dbData.data.split('/').reverse().map(Number);
          const d = new Date(parts[0], parts[1] - 1 + i, Math.min(parts[2], new Date(parts[0], parts[1] + i, 0).getDate()));
          const dataStr = d.toISOString().split('T')[0];
          batch.push({ 
            ...dbData, 
            tipo: 'receita', 
            descricao: baseDesc, 
            data: dataStr, 
            status: i === 0 ? (dbData.status || 'pago') : 'pendente',
            recorrencia_id: serieId 
          });
        }
        await inserirBulk(batch)
      } else {
        const assoc = cleanData.associado_id ? associados.find(a => a.id === cleanData.associado_id) : null;
        const finalDesc = assoc ? `${cleanData.descricao.toUpperCase()} - ${assoc.nome.toUpperCase()}` : cleanData.descricao.toUpperCase();
        
        const itemsToInsert = [];
        
        // Prepara a receita principal
        itemsToInsert.push({ 
          ...cleanData, 
          tipo: 'receita' as const,
          descricao: finalDesc, 
          status: cleanData.status || 'pago' 
        });

        // Se houver troco em PIX, prepara a despesa automática
        if (cleanData.troco_via_pix && Number(cleanData.valor_troco) > 0) {
            itemsToInsert.push({
                tipo: 'despesa' as const,
                descricao: `TROCO EM PIX - ${assoc?.nome.toUpperCase() || 'CLIENTE'}`,
                valor: Number(cleanData.valor_troco),
                data: cleanData.data,
                status: 'pago' as const,
                conta_id: cleanData.conta_id,
                categoria: 'TROCO',
                forma_pagamento: 'PIX'
            });
        }
        
        await inserirBulk(itemsToInsert);
      }
    }
    setEditingItem(null); setIsModalOpen(false)
  }

  const handleDetail = (item: any) => {
    setSelectedForDetail(item)
    setIsDetailModalOpen(true)
  }

  const handleEdit = (item: any) => { setEditingItem(item); setIsModalOpen(true) }
  const handleDuplicate = (item: any) => { setEditingItem({ ...item, id: undefined }); setIsModalOpen(true) }
  
  const handleDelete = async (item: any) => {
    if (item.recorrencia_id) {
      if (confirm('Esta receita faz parte de uma série recorrente. Deseja excluir TODA a série?')) {
        await removerSerie(item.recorrencia_id)
        return
      }
    }
    
    if (confirm('Excluir esta receita?')) {
      await remover(item.id)
    }
  }

  const handleBatchDelete = async () => {
    if (confirm(`Deseja excluir os ${selectedIds.length} itens selecionados?`)) {
      await removerBulk(selectedIds)
      setSelectedIds([])
    }
  }

  const handleBatchStatus = async (status: 'pago' | 'aberto') => {
    await atualizarBulk(selectedIds, { status })
    setSelectedIds([])
  }

  const modalFields: Field[] = useMemo(() => [
    { name: 'descricao', label: 'Descrição', type: 'text', required: true },
    { name: 'valor', label: 'Valor (R$)', type: 'number', required: true },
    { name: 'data', label: 'Data', type: 'date', required: true },
    { name: 'conta_id', label: 'Conta de Destino', type: 'select', required: true, options: contas.map(c => ({ value: c.id, label: c.nome })) },
    { name: 'categoria', label: 'Categoria', type: 'select', required: true, options: [{ value: 'ADESAO', label: 'Adesão' }, { value: 'MENSALIDADE', label: 'Mensalidade' }, { value: 'ESTORNO', label: 'Estorno' }, { value: 'OUTROS', label: 'Outros' }] },
    { name: 'associado_id', label: 'Associado Individual', type: 'select', showIf: (f: any) => !f.is_lote, options: [{ value: '', label: 'Nenhum' }, ...associados.map(a => ({ value: a.id, label: a.nome }))] },
    { name: 'is_lote', label: '🚀 Lançar em Lote?', type: 'checkbox', showIf: (f: any) => !editingItem },
    { 
      name: 'batch_selection', label: 'Selecionar Associados (Lote)', type: 'info', showIf: (f: any) => f.is_lote,
      render: (formData: any, handleChange: any) => {
        const selected = formData.selected_associados || []
        const filteredList = associados.filter(a => a.nome.toLowerCase().includes(batchSearch.toLowerCase())).slice(0, 10)
        return (
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} /><input type="text" placeholder="Pesquisar associado..." className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-xs border border-gray-100 outline-none focus:ring-2 ring-indigo-50" value={batchSearch} onChange={e => setBatchSearch(e.target.value)} /></div>
            <div className="grid grid-cols-1 gap-1 max-h-[160px] overflow-y-auto pr-2">
              {filteredList.map(a => {
                const isSel = selected.includes(a.id)
                return (
                  <button key={a.id} type="button" onClick={() => handleChange('selected_associados', isSel ? selected.filter((sid: string) => sid !== a.id) : [...selected, a.id])} className={`flex items-center justify-between p-2 rounded-xl text-left transition-all ${isSel ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-800 hover:bg-gray-100'}`}>
                    <span className="text-xs font-bold truncate">{a.nome}</span>
                    {isSel ? <Check size={14} /> : <Plus size={14} className="text-gray-300" />}
                  </button>
                )
              })}
            </div>
          </div>
        )
      }
    },
    { name: 'troco_via_pix', label: '💸 Troco via PIX?', type: 'checkbox', showIf: (f: any) => !f.is_lote },
    { name: 'valor_troco', label: 'Valor do Troco (R$)', type: 'number', showIf: (f: any) => f.troco_via_pix && !f.is_lote },
    { name: 'recorrencia_ativa', label: 'Lançamento Recorrente', type: 'checkbox' },
    { name: 'recorrencia_meses', label: 'Meses', type: 'number', showIf: (f: any) => f.recorrencia_ativa, defaultValue: 12 },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'pago', label: 'Recebido' }, { value: 'pendente', label: 'Pendente' }] }
  ], [contas, associados, batchSearch, editingItem])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald)' }}><TrendingUp size={24} /></div>
          <div><div className="page-title">Receitas</div><div className="page-subtitle">Entradas financeiras — ACPROBEC</div></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 18px', textAlign: 'center' }}><div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Total</div><div style={{ fontSize: 18, fontWeight: 800, color: 'var(--emerald)' }}>{fmtR(totalReceitas)}</div></div>
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true) }} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 13 }}><Plus size={16} /> Nova Receita</button>
        </div>
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <ChartCard title="📊 Receita Mensal" subtitle="Evolução das entradas"><Bar data={{ labels: MESES, datasets: [{ label: 'Receita', data: receitaMensal, backgroundColor: 'rgba(16,185,129,.72)', borderRadius: 5, borderSkipped: false }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: axisDefaults }} /></ChartCard>
        <ChartCard title="🍩 Mix de Receitas" subtitle="Distribuição por categoria"><Doughnut data={{ labels: Object.keys(receitaCats), datasets: [{ data: Object.values(receitaCats), backgroundColor: CHART_COLORS, hoverOffset: 6, borderWidth: 2, borderColor: '#fff' }] }} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14, font: { size: 11 } } } } }} /></ChartCard>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Pesquisar por descrição, associado ou categoria..." className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm outline-none focus:ring-2 ring-[#2d8c6f]/10 transition-all font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="bg-gray-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none hover:bg-white transition-all">{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
          <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className="bg-gray-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none hover:bg-white transition-all"><option value={-1}>Todos Meses</option>{MESES.map((m, idx) => <option key={m} value={idx}>{m}</option>)}</select>
          <div className="w-px h-8 bg-gray-100 mx-1" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-gray-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none hover:bg-white transition-all">
            <option value="todos">Status: Todos</option>
            <option value="pago">Somente Recebidos</option>
            <option value="pendente">Pagar / Pendentes</option>
          </select>
          <select value={filterPagamento} onChange={(e) => setFilterPagamento(e.target.value)} className="bg-gray-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none hover:bg-white transition-all">
            <option value="todos">Pagamento: Todos</option>
            <option value="PIX">PIX</option>
            <option value="Boleto">Boleto</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Transferência">Transferência</option>
          </select>
          <select value={filterConta} onChange={(e) => setFilterConta(e.target.value)} className="bg-gray-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none hover:bg-white transition-all">
            <option value="todos">Conta: Todas</option>
            {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <select value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)} className="bg-gray-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none hover:bg-white transition-all">
            <option value="todos">Categoria: Todas</option>
            <option value="ADESAO">Adesão</option>
            <option value="MENSALIDADE">Mensalidade</option>
            <option value="ESTORNO">Estorno</option>
            <option value="OUTROS">Outros</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable columns={[
          { header: 'Data', key: 'data', render: (i: any) => <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>{fmtData(i.data)}</span> },
          { header: 'Descrição', key: 'descricao', render: (i: any) => <div style={{ display: 'flex', flexDirection: 'column' }}><div className="flex items-center gap-2"><span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>{i.descricao}</span>{i.banco_transacao_id && <span className="text-[8px] font-black bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1 shadow-sm uppercase tracking-tighter"><RefreshCw size={8} /> OFX</span>}</div><span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>{i.categoria}</span></div> },
          { header: 'Valor', key: 'valor', render: (i: any) => <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--emerald)' }}>{fmtR(i.valor)}</span> },
          { header: 'Taxa', key: 'taxa', render: (i: any) => {
            const match = (i.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/)
            return <span className={`text-[11px] font-black ${match ? 'text-amber-600' : 'text-gray-300'}`}>{match ? `R$ ${match[1]}` : 'R$ 0,00'}</span>
          }},
          { header: 'Status', key: 'status', render: (i: any) => <StatusBadge status={i.status} type="lancamento" /> },
          { header: 'Pagamento', key: 'forma_pagamento', render: (i: any) => <PaymentBadge method={i.forma_pagamento} /> },
          { header: '', key: 'acoes', className: 'w-20 text-right', render: (i: any) => (
            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(i)} title="Editar" className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <Pencil size={14} />
              </button>
              <button onClick={() => handleDelete(i)} title="Excluir" className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                <XCircle size={14} />
              </button>
            </div>
          )}
        ]} data={filteredReceitas} loading={loading} selectedIds={selectedIds} onSelectChange={setSelectedIds} onRowClick={handleDetail} />
      </div>

      <BatchActionBar 
        selectedCount={selectedIds.length} 
        onClear={() => setSelectedIds([])} 
        onDelete={handleBatchDelete} 
        onStatusChange={handleBatchStatus} 
      />

      <CrudModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Editar Receita' : 'Nova Receita'} initialData={editingItem} onSubmit={handleSalvar} fields={modalFields} />
      
      <LaunchDetailsModal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        launch={selectedForDetail}
        associadoNome={selectedForDetail?.associado_id ? associados.find((a: any) => a.id === selectedForDetail.associado_id)?.nome : undefined}
      />
    </div>
  )
}
