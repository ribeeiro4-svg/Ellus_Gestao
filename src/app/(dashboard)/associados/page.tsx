'use client'
import React, { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
  LineElement, PointElement,
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import CrudModal from '@/components/ui/CrudModal'
import ChartCard from '@/components/ui/ChartCard'
import { fmtR, MESES } from '@/lib/utils/formatters'
import { Plus, Users, Mail, Phone, Copy, AlertCircle, Trash2, CheckSquare, RefreshCw, Pencil, XCircle, Search, FileText, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useTenant } from '@/lib/hooks/useTenant'
import { fetchZapSignSignedFileAction } from '@/app/actions/zapsign'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, LineElement, PointElement)

export default function AssociadosPage() {
  const { associados, loading, isSyncing, inserir, atualizar, remover, atualizarBulk, syncZapSign, refresh } = useAssociados()
  const { lancamentos } = useFinanceiro()
  const { tenant } = useTenant()
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (id: string) => {
    const next = new Set(expandedRows)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedRows(next)
  }
  
  const normalizeStr = (str: string) => {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
  }

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [searchQ, setSearchQ] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [filterCategoria, setFilterCategoria] = useState<string>('todas')
  const [filterCpfInvalido, setFilterCpfInvalido] = useState(false)
  const [isUpdatingBulk, setIsUpdatingBulk] = useState(false)
  const [isSyncingRec, setIsSyncingRec] = useState(false)

  const handleSyncZapSign = async () => {
    const res = await syncZapSign()
    if (res.error) {
      const msg = typeof res.error === 'object' ? (res.error as any).message : res.error
      alert(`Erro na sincronização: ${msg}`)
    } else if (res.count) {
      alert(`Sucesso! ${res.count} associados sincronizados da ZapSign.`)
    } else {
      alert(res.message || 'Sincronização concluída.')
    }
  }

  const handleSyncCoraRecurrences = async () => {
    setIsSyncingRec(true)
    try {
      const response = await fetch('/api/cora/recurrences/sync')
      const res = await response.json()
      if (res.error) alert(`Erro na sincronização: ${res.error}`)
      else if (res.summary) {
        alert(`Sucesso! Foram encontrados ${res.summary.total} registros e ${res.summary.updated} associados foram atualizados.`)
        await refresh()
      }
    } catch (err) {
      alert('Falha na comunicação com o servidor.')
    } finally {
      setIsSyncingRec(false)
    }
  }

  const ativos = useMemo(() => associados.filter((a: any) => (a.status || '').toLowerCase().includes('ativ')).length, [associados])
  const inadimplentes = useMemo(() => associados.filter((a: any) => (a.status || '').toLowerCase().includes('inadimp')).length, [associados])
  const inativos = useMemo(() => associados.filter((a: any) => (a.status || '').toLowerCase().includes('inat')).length, [associados])

  const catMap = useMemo(() => {
    const m: Record<string, number> = {}
    associados.forEach((a: any) => { const c = a.categoria || 'Sem categoria'; m[c] = (m[c] || 0) + 1 })
    return Object.keys(m).length ? m : { 'Sem dados': 1 }
  }, [associados])

  const categorias = useMemo(() => [...new Set(associados.map((a: any) => a.categoria || 'Sem categoria'))].sort(), [associados])
  
  const crescimentoMensal = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const months = Array(12).fill(0)
    
    // Calcula o saldo inicial (quem entrou antes do ano atual)
    const baseCount = associados.filter((a: any) => {
      const joinDate = a.data_ingresso || a.created_at
      if (!joinDate) return false
      return new Date(joinDate).getFullYear() < currentYear
    }).length

    // Conta entradas mês a mês no ano atual
    associados.forEach((a: any) => {
      const joinDate = a.data_ingresso || a.created_at
      if (!joinDate) return
      const date = new Date(joinDate)
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth()
        months[month]++
      }
    })

    // Torna cumulativo
    let runningTotal = baseCount
    return months.map(count => {
      runningTotal += count
      return runningTotal
    })
  }, [associados])

  const filtrados = useMemo(() => {
    let res = associados
    if (searchQ) {
      const q = normalizeStr(searchQ)
      res = res.filter((a: any) => normalizeStr(a.nome).includes(q) || (a.cpf || '').includes(q) || (a.email || '').toLowerCase().includes(q))
    }
    if (filterStatus !== 'todos') res = res.filter((a: any) => (a.status || '').toLowerCase() === filterStatus)
    if (filterCategoria !== 'todas') res = res.filter((a: any) => (a.categoria || '') === filterCategoria)
    if (filterCpfInvalido) res = res.filter((a: any) => (a.cpf || '').replace(/\D/g, '').length < 11)
    return res
  }, [associados, searchQ, filterStatus, filterCategoria, filterCpfInvalido])

  const hasActiveFilters = filterStatus !== 'todos' || filterCategoria !== 'todas' || filterCpfInvalido || searchQ !== ''
  const clearFilters = () => { setFilterStatus('todos'); setFilterCategoria('todas'); setFilterCpfInvalido(false); setSearchQ('') }

  const handleSalvar = async (data: any) => {
    if (editingItem) { await atualizar(editingItem.id, data) }
    else { await inserir({ ...data, status: data.status || 'ativo' }) }
    setIsModalOpen(false)
  }
  const handleEdit = (item: any) => { setEditingItem(item); setIsModalOpen(true) }
  const handleDuplicate = (item: any) => { const { id, ...rest } = item; setEditingItem(rest); setIsModalOpen(true) }
  const handleDelete = async (id: string) => { if (confirm('Excluir este associado?')) await remover(id) }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Excluir ${selectedIds.length} associados?`)) return
    setIsDeleting(true)
    try { for (const id of selectedIds) await remover(id); setSelectedIds([]) }
    finally { setIsDeleting(false) }
  }

  const handleBatchUpdateVencimento = async (dia: number) => {
    if (selectedIds.length === 0) return
    setIsUpdatingBulk(true)
    try {
      const res = await atualizarBulk(selectedIds, { vencimento_dia: dia } as any)
      if (!res.error) { alert('Atualizado com sucesso!'); setSelectedIds([]) }
    } finally { setIsUpdatingBulk(false) }
  }

  const handleDownloadTermo = async (item: any) => {
    if (!tenant?.zapsign_token || !item.zapsign_doc_token) return
    setDownloadingDoc(item.id)
    try {
      const res = await fetchZapSignSignedFileAction(tenant.zapsign_token, item.zapsign_doc_token)
      if (res.error) alert(res.error)
      else if (res.url) window.open(res.url, '_blank')
    } finally {
      setDownloadingDoc(null)
    }
  }

  const columns = [
    {
      header: 'Associado', key: 'nome', className: 'min-w-[350px] whitespace-normal',
      render: (i: any) => {
        const isExpanded = expandedRows.has(i.id)
        const hasHistory = i.zapsign_signers && i.zapsign_signers.length > 0
        
        return (
          <div className="flex flex-col gap-2 py-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-emerald-100/50">
                {(i.nome || 'A')[0]}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{i.nome}</span>
                  {hasHistory && (
                    <button 
                      onClick={() => toggleRow(i.id)}
                      className={`p-1 rounded-lg transition-all ${isExpanded ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-400 hover:text-slate-600'}`}
                    >
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-[1px] opacity-70">#{i.codigo}</span>
              </div>
            </div>

            {isExpanded && hasHistory && (
              <div className="ml-12 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col gap-2 animate-in slide-in-from-top-1 duration-200 mb-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[1px] mb-1">Status de Assinaturas:</p>
                {i.zapsign_signers.map((s: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'signed' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="text-[10px] font-bold text-slate-600 max-w-[150px] truncate">{s.name}</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                      s.status === 'signed' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {s.status === 'signed' ? '✓ Assinado' : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {isExpanded && (
              <div className="ml-12 p-3 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 flex flex-col gap-3 animate-in slide-in-from-top-1 duration-300">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-emerald-700/60 uppercase tracking-[1px]">Extrato Financeiro {new Date().getFullYear()}:</p>
                  <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase">Mensalidades</span>
                </div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {MESES.map((mes, idx) => {
                    const matches = lancamentos.filter((l: any) => {
                      const isCorrectAssociate = l.associado_id === i.id;
                      const isTargetCategory = l.categoria?.toUpperCase().includes('MENSALIDADE') || 
                                             l.descricao?.toUpperCase().includes('MENSALIDADE') ||
                                             l.categoria?.toUpperCase().includes('ADESÃO') ||
                                             l.descricao?.toUpperCase().includes('ADESÃO');
                      
                      if (!isCorrectAssociate || !isTargetCategory) return false;

                      const d = new Date(l.data);
                      const compMes = l.competencia_mes !== undefined && l.competencia_mes !== null ? l.competencia_mes : d.getMonth();
                      const compAno = l.competencia_ano !== undefined && l.competencia_ano !== null ? l.competencia_ano : d.getFullYear();

                      return compMes === idx && compAno === new Date().getFullYear();
                    })

                    // Prioriza o registro PAGO se houver múltiplos no mesmo mês
                    const lanc = matches.find((l: any) => l.status === 'pago') || matches[0];
                    const isAdesao = lanc?.categoria?.toUpperCase().includes('ADESÃO') || lanc?.descricao?.toUpperCase().includes('ADESÃO');

                    return (
                      <div key={mes} className="flex items-center justify-between border-b border-emerald-100/30 pb-1 last:border-0">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{mes.substring(0,3)}</span>
                        {lanc ? (
                          <div className="flex items-center gap-1.5">
                            {isAdesao ? (
                              <span className="text-[8px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-[4px] uppercase tracking-tighter">ADESÃO</span>
                            ) : (
                              <>
                                <span className="text-[9px] font-bold text-slate-700">{fmtR(lanc.valor)}</span>
                                <span className={`w-2 h-2 rounded-full ${
                                  lanc.status === 'pago' ? 'bg-emerald-500' : 
                                  lanc.status === 'atrasado' ? 'bg-rose-500' : 'bg-slate-300'
                                }`} title={lanc.status} />
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300">--</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      }
    },
    { header: 'CPF/CNPJ', key: 'cpf', className: 'w-[140px]', render: (i: any) => <span className="text-[11px] font-medium text-gray-500">{i.cpf || 'Pendente'}</span> },
    { header: 'Mensalidade', key: 'mensalidade', className: 'w-[130px]', render: (i: any) => <span className="text-xs font-bold text-gray-900">{fmtR(i.mensalidade)}</span> },
    { header: 'Status', key: 'status', className: 'w-[120px]', render: (i: any) => <StatusBadge status={i.status} type="associado" /> },
    {
      header: 'Contato', key: 'telefone', className: 'w-[140px]',
      render: (i: any) => (
        <div className="flex items-center gap-2">
          {i.email && <a href={`mailto:${i.email}`} className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-all"><Mail size={12} /></a>}
          {i.telefone && <a href={`https://wa.me/${i.telefone.replace(/\D/g, '')}`} target="_blank" className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-600 hover:text-white transition-all"><Phone size={12} /></a>}
          {i.zapsign_doc_token && (
            <button 
              onClick={() => handleDownloadTermo(i)} 
              disabled={downloadingDoc === i.id}
              className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
              title="Baixar Termo Assinado"
            >
              {downloadingDoc === i.id ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
            </button>
          )}
        </div>
      )
    },
    {
      header: '', key: 'acoes', className: 'w-[80px] text-right',
      render: (i: any) => (
        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => handleEdit(i)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md"><Pencil size={12} /></button>
          <button onClick={() => handleDuplicate(i)} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md"><Copy size={12} /></button>
          <button onClick={() => handleDelete(i.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md"><XCircle size={12} /></button>
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Associados</h1>
            <p className="text-xs text-gray-500 font-medium">Gestão da carteira de membros</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSyncZapSign} disabled={isSyncing} className="btn-secondary text-[10px] uppercase font-black px-4 py-2.5 flex items-center gap-2 bg-emerald-50 text-emerald-700 border-none">
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            Sincronizar ZapSign
          </button>
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true) }} className="btn-primary text-[10px] uppercase font-black px-5 py-2.5 flex items-center gap-2">
            <Plus size={14} /> Novo Associado
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard title="Crescimento" subtitle="Evolução acumulativa">
            <Line 
              data={{ 
                labels: MESES, 
                datasets: [{ 
                  label: 'Associados', 
                  data: crescimentoMensal, 
                  borderColor: '#10b981',
                  backgroundColor: 'rgba(16,185,129,0.08)',
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: '#fff',
                  pointBorderColor: '#10b981',
                  pointBorderWidth: 2,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                }] 
              }} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false, 
                scales: { 
                  x: { grid: { display: false }, ticks: { font: { size: 9, weight: 'bold' }, color: '#94a3b8' } }, 
                  y: { beginAtZero: false, border: { display: false }, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 }, color: '#94a3b8' } } 
                }, 
                plugins: { 
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: '#1e293b',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    cornerRadius: 8,
                    displayColors: false
                  }
                } 
              }} 
            />
          </ChartCard>
        </div>
        <ChartCard title="Mix" subtitle="Por categoria"><Doughnut data={{ labels: Object.keys(catMap).map(k => `${k} (${catMap[k]})`), datasets: [{ data: Object.values(catMap), backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'], borderWidth: 0 }] }} options={{ responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 10 } } } } }} /></ChartCard>
      </div>

      <div className="flex flex-col gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-grow min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Busca global..." className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 ring-indigo-500/10" value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-gray-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none">{['todos', 'ativo', 'inadimplente', 'inativo'].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}</select>
          <select value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)} className="bg-gray-50 px-4 py-3 rounded-2xl text-xs font-bold border-none outline-none">
            <option value="todas">TODAS CATEGORIAS</option>
            {categorias.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
          </select>
          {hasActiveFilters && <button onClick={clearFilters} className="text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors">Limpar Filtros</button>}
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-2xl animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
             <CheckSquare className="text-red-600" size={18} />
             <span className="text-sm font-bold text-red-800">{selectedIds.length} selecionados</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleBatchUpdateVencimento(10)} className="px-3 py-1.5 bg-white text-indigo-600 border border-indigo-100 rounded-lg text-[10px] font-black uppercase shadow-sm">Dia 10</button>
            <button onClick={() => handleBatchUpdateVencimento(20)} className="px-3 py-1.5 bg-white text-orange-600 border border-orange-100 rounded-lg text-[10px] font-black uppercase shadow-sm">Dia 20</button>
            <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase shadow-md flex items-center gap-2"><Trash2 size={12} /> Excluir</button>
          </div>
        </div>
      )}

      <DataTable 
        columns={columns} 
        data={filtrados} 
        loading={loading} 
        selectedIds={selectedIds}
        onSelectChange={setSelectedIds}
        showFilterInputs={true}
      />

      <CrudModal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Editar' : 'Novo'} initialData={editingItem} onSubmit={handleSalvar}
        fields={[
          { name: 'nome', label: 'Nome', type: 'text', required: true },
          { name: 'cpf', label: 'CPF/CNPJ', type: 'text' },
          { name: 'codigo', label: 'Matrícula', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'text', required: true },
          { name: 'telefone', label: 'WhatsApp', type: 'text' },
          { name: 'mensalidade', label: 'Valor', type: 'number', required: true },
          { name: 'data_ingresso', label: 'Ingresso', type: 'date', required: true },
          { name: 'status', label: 'Status', type: 'select', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'inadimplente', label: 'Inadimplente' }, { value: 'inativo', label: 'Inativo' }] }
        ]}
      />
    </div>
  )
}
