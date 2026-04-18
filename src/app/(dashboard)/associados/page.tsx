'use client'
import React, { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { useAssociados } from '@/lib/hooks/useAssociados'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import CrudModal from '@/components/ui/CrudModal'
import ChartCard from '@/components/ui/ChartCard'
import { fmtR, MESES } from '@/lib/utils/formatters'
import { Plus, Users, Mail, Phone, Copy, AlertCircle, Trash2, CheckSquare, RefreshCw, Pencil, XCircle } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

export default function AssociadosPage() {
  const { associados, loading, isSyncing, inserir, atualizar, remover, atualizarBulk, syncZapSign, refresh } = useAssociados()
  
  // Helper para normalização de strings (busca sem acentos)
  const normalizeStr = (str: string) => {
    return (str || '')
      .normalize('NFD') // Decompõe acentos
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .toLowerCase()
      .trim()
  }

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [searchQ, setSearchQ] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
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
      
      if (res.error) {
        alert(`Erro na sincronização: ${res.error}`)
      } else if (res.summary) {
        alert(`Sucesso! Foram encontrados ${res.summary.total} registros e ${res.summary.updated} associados foram atualizados com o dia de vencimento.`)
        await refresh() // Atualiza a tabela na tela
      } else {
        alert(res.message || 'Sincronização de recorrências concluída.')
      }
    } catch (err) {
      alert('Falha na comunicação com o servidor de sincronização.')
    } finally {
      setIsSyncingRec(false)
    }
  }

  /* ── Dados para gráficos ── */
  const ativos = useMemo(() => associados.filter((a: any) => (a.status || '').toLowerCase().includes('ativ')).length, [associados])
  const inadimplentes = useMemo(() => associados.filter((a: any) => (a.status || '').toLowerCase().includes('inadimp')).length, [associados])
  const inativos = useMemo(() => associados.filter((a: any) => (a.status || '').toLowerCase().includes('inat')).length, [associados])

  const catMap = useMemo(() => {
    const m: Record<string, number> = {}
    associados.forEach((a: any) => { const c = a.categoria || 'Sem categoria'; m[c] = (m[c] || 0) + 1 })
    return Object.keys(m).length ? m : { 'Sem dados': 1 }
  }, [associados])

  const categorias = useMemo(() => [...new Set(associados.map((a: any) => a.categoria || 'Sem categoria'))].sort(), [associados])

  const filtrados = useMemo(() => {
    let res = associados
    
    // Filtro de busca textual inteligente
    if (searchQ) {
      const q = normalizeStr(searchQ)
      res = res.filter((a: any) => {
        const nome = normalizeStr(a.nome)
        const cpf = (a.cpf || '').replace(/\D/g, '')
        const email = (a.email || '').toLowerCase()
        const codigo = (a.codigo || '').toLowerCase()
        
        return nome.includes(q) || cpf.includes(q) || email.includes(q) || codigo.includes(q)
      })
    }

    // Filtro de status
    if (filterStatus !== 'todos') res = res.filter((a: any) => (a.status || '').toLowerCase() === filterStatus)
    // Filtro de categoria
    if (filterCategoria !== 'todas') res = res.filter((a: any) => (a.categoria || '') === filterCategoria)
    // Filtro CPF inválido
    if (filterCpfInvalido) res = res.filter((a: any) => (a.cpf || '').replace(/\D/g, '').length < 11)
    return res
  }, [associados, searchQ, filterStatus, filterCategoria, filterCpfInvalido])

  const hasActiveFilters = filterStatus !== 'todos' || filterCategoria !== 'todas' || filterCpfInvalido || searchQ !== ''
  const clearFilters = () => { setFilterStatus('todos'); setFilterCategoria('todas'); setFilterCpfInvalido(false); setSearchQ('') }

  /* ── CRUD helpers ── */
  const handleSalvar = async (data: any) => {
    if (editingItem) { await atualizar(editingItem.id, data) }
    else { await inserir({ ...data, status: data.status || 'ativo' }) }
  }
  const handleEdit = (item: any) => { setEditingItem(item); setIsModalOpen(true) }
  const handleDuplicate = (item: any) => {
    const { id, ...rest } = item
    setEditingItem(rest)
    setIsModalOpen(true)
  }
  const handleDelete = async (id: string) => {
    if (confirm('Excluir este associado?')) await remover(id)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtrados.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtrados.map((a: any) => a.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Excluir ${selectedIds.size} associado(s) selecionado(s)? Esta ação não pode ser desfeita.`)) return
    setIsDeleting(true)
    try {
      for (const id of selectedIds) {
        await remover(id)
      }
      setSelectedIds(new Set())
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBatchUpdateVencimento = async (dia: number) => {
    if (selectedIds.size === 0) return
    if (!confirm(`Deseja definir o vencimento dia ${dia} para ${selectedIds.size} associado(s)?`)) return
    setIsUpdatingBulk(true)
    try {
      const ids = Array.from(selectedIds)
      const res = await atualizarBulk(ids, { vencimento_dia: dia } as any)
      if (res.error) alert(`Erro ao atualizar: ${res.error}`)
      else {
        alert(`${selectedIds.size} associados atualizados com sucesso!`)
        setSelectedIds(new Set())
      }
    } finally {
      setIsUpdatingBulk(false)
    }
  }

  const barFontSm = { size: 10 }

  /* ── Colunas ── */
  const allSelected = filtrados.length > 0 && selectedIds.size === filtrados.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < filtrados.length

  const columns = [
    {
      header: '', key: 'checkbox', className: 'w-10',
      render: (i: any) => (
        <input
          type="checkbox"
          checked={selectedIds.has(i.id)}
          onChange={() => toggleSelect(i.id)}
          onClick={e => e.stopPropagation()}
          className="w-4 h-4 rounded border-gray-300 text-red-600 cursor-pointer accent-red-600"
        />
      )
    },
    {
      header: 'Associado', key: 'nome',
      render: (i: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(45,140,111,.12)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, border: '1.5px solid rgba(45,140,111,.2)' }}>
            {(i.nome || 'A')[0].toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>{i.nome}</span>
            <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>#{i.codigo}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'CPF/CNPJ', key: 'cpf', 
      render: (i: any) => {
        const digits = (i.cpf || '').replace(/\D/g, '')
        const isValid = digits.length >= 11
        return (
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, fontWeight: 600, color: isValid ? 'var(--text2)' : '#cbd5e1' }}>
              {i.cpf || 'Pendente'}
            </span>
            {!isValid && <div title="CPF não informado"><AlertCircle size={10} className="text-amber-400" /></div>}
          </div>
        )
      }
    },
    { header: 'Categoria', key: 'categoria', render: (i: any) => <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase' }}>{i.categoria}</span> },
    { header: 'Mensalidade', key: 'mensalidade', render: (i: any) => <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)' }}>{fmtR(i.mensalidade)}</span> },
    { header: 'Status', key: 'status', render: (i: any) => <StatusBadge status={i.status} type="associado" /> },
    {
      header: 'Contato', key: 'id',
      render: (i: any) => (
        <div className="flex items-center gap-3">
          {i.email && (
            <a href={`mailto:${i.email}`} title={i.email} className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
              <Mail size={14} />
            </a>
          )}
          {i.telefone && (
            <a href={`https://wa.me/${i.telefone.replace(/\D/g, '')}`} target="_blank" title={i.telefone} className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
              <Phone size={14} />
            </a>
          )}
        </div>
      )
    },
    {
      header: '', key: 'acoes', className: 'w-20 text-right',
      render: (i: any) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => handleDuplicate(i)} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors" title="Duplicar">
            <Copy size={14} />
          </button>
          <button onClick={() => handleEdit(i)} title="Editar" className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={() => handleDelete(i.id)} title="Excluir" className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
            <XCircle size={14} />
          </button>
        </div>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page Header ── */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(79,126,248,.1)', border: '1px solid rgba(79,126,248,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f7ef8' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="page-title">Associados</div>
            <div className="page-subtitle">Gestão da carteira de associados — ACPROBEC</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button 
            onClick={handleSyncZapSign} 
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-[#2d8c6f] text-white rounded-xl text-[10px] font-black uppercase hover:bg-[#246d56] transition-all disabled:opacity-50 shadow-sm"
          >
            {isSyncing ? (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            ) : (
              <RefreshCw size={14} />
            )}
            Sincronizar ZapSign
          </button>

          <button 
            onClick={handleSyncCoraRecurrences} 
            disabled={isSyncingRec}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e4a3c] text-white rounded-xl text-[10px] font-black uppercase hover:bg-[#122e23] transition-all disabled:opacity-50 shadow-sm"
          >
            {isSyncingRec ? (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            ) : (
              <RefreshCw size={14} />
            )}
            Importar Vencimentos (Cora)
          </button>
          {/* Checkbox Selecionar Todos */}
          <div
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all select-none"
            onClick={toggleSelectAll}
            title={allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
          >
            <input
              type="checkbox"
              checked={allSelected}
              ref={el => { if (el) el.indeterminate = someSelected }}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded accent-red-600 cursor-pointer"
            />
            <span className="text-xs font-bold text-gray-500">
              {selectedIds.size > 0 ? `${selectedIds.size} selecionado(s)` : 'Sel. todos'}
            </span>
          </div>

          {[
            { label: 'Ativos', value: ativos, color: 'var(--green)' },
            { label: 'Inadimpl.', value: inadimplentes, color: 'var(--red)' },
            { label: 'Total', value: associados.length, color: 'var(--accent)' },
          ].map(k => (
            <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true) }} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 13 }}>
            <Plus size={16} /> Novo Associado
          </button>
        </div>
      </div>

      {/* ── Barra de Exclusão em Lote ── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-2xl animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
              <CheckSquare size={16} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-800">{selectedIds.size} associado(s) selecionado(s)</p>
              <p className="text-[10px] text-red-500 font-medium">Confirme antes de excluir — a ação é irreversível.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleBatchUpdateVencimento(10)}
              disabled={isUpdatingBulk}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              Definir Dia 10
            </button>
            <button
              onClick={() => handleBatchUpdateVencimento(20)}
              disabled={isUpdatingBulk}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-black hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 disabled:opacity-50"
            >
              Definir Dia 20
            </button>
            <div className="w-px h-6 bg-red-200 mx-2" />
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-4 py-2 text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-black hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50"
            >
              {isDeleting ? (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : (
                <Trash2 size={14} />
              )}
              Excluir {selectedIds.size} registro(s)
            </button>
          </div>
        </div>
      )}

      {/* ── Gráficos ── */}
      <div className="charts-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <ChartCard title="👥 Evolução por Status" subtitle="Visão mensal de ativos e inadimplentes">
          <Bar
            data={{
              labels: MESES,
              datasets: [
                { label: 'Ativos', data: Array(12).fill(ativos), backgroundColor: 'rgba(45,140,111,.65)', borderRadius: 5, borderSkipped: false },
                { label: 'Inadimplentes', data: Array(12).fill(inadimplentes), backgroundColor: 'rgba(224,123,57,.65)', borderRadius: 5, borderSkipped: false },
                { label: 'Inativos', data: Array(12).fill(inativos), backgroundColor: 'rgba(148,163,184,.5)', borderRadius: 5, borderSkipped: false },
              ]
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: barFontSm } } },
              scales: {
                x: { grid: { display: false }, ticks: { font: barFontSm } },
                y: { grid: { color: 'rgba(0,0,0,.04)' }, ticks: { font: barFontSm, stepSize: 1 } },
              },
            }}
          />
        </ChartCard>

        <ChartCard title="🍩 Por Categoria" subtitle="Distribuição por tipo de associado">
          <Doughnut
            data={{
              labels: Object.keys(catMap),
              datasets: [{
                data: Object.values(catMap),
                backgroundColor: ['#2d8c6f', '#34d399', '#f59e0b', '#e07b39', '#c084fc', '#22d3ee'],
                hoverOffset: 6, borderWidth: 2, borderColor: '#fff',
              }]
            }}
            options={{
              responsive: true, maintainAspectRatio: false, cutout: '65%',
              plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14, font: barFontSm } } }
            }}
          />
        </ChartCard>
      </div>

      {/* ── Barra de Filtros ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Linha 1: Busca */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text3)', flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            type="text"
            placeholder="Buscar por nome, código, CPF ou email..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--text1)', width: '100%', fontFamily: 'inherit' }}
          />
          {hasActiveFilters && (
            <button onClick={clearFilters} style={{ whiteSpace: 'nowrap', color: 'var(--text3)', cursor: 'pointer', fontSize: 11, border: '1px solid var(--border)', background: 'var(--bg)', borderRadius: 8, padding: '4px 10px', fontWeight: 700 }}>✕ Limpar filtros</button>
          )}
        </div>

        {/* Linha 2: Chips de filtro */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Status */}
          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginRight: 4 }}>Status:</span>
          {[
            { key: 'todos', label: 'Todos', color: 'var(--text2)', bg: 'var(--bg)' },
            { key: 'ativo', label: `Ativos (${ativos})`, color: '#16a34a', bg: '#dcfce7' },
            { key: 'inadimplente', label: `Inadimp. (${inadimplentes})`, color: '#dc2626', bg: '#fee2e2' },
            { key: 'inativo', label: `Inativos (${inativos})`, color: '#64748b', bg: '#f1f5f9' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setFilterStatus(s.key)}
              style={{
                fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                border: filterStatus === s.key ? `2px solid ${s.color}` : '1px solid var(--border)',
                background: filterStatus === s.key ? s.bg : 'transparent',
                color: filterStatus === s.key ? s.color : 'var(--text3)',
                cursor: 'pointer', transition: 'all .15s'
              }}
            >{s.label}</button>
          ))}

          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

          {/* Categoria */}
          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginRight: 4 }}>Categoria:</span>
          <select
            value={filterCategoria}
            onChange={e => setFilterCategoria(e.target.value)}
            style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, border: filterCategoria !== 'todas' ? '2px solid var(--accent)' : '1px solid var(--border)', background: filterCategoria !== 'todas' ? 'rgba(45,140,111,.08)' : 'transparent', color: filterCategoria !== 'todas' ? 'var(--accent)' : 'var(--text3)', cursor: 'pointer', outline: 'none' }}
          >
            <option value="todas">Todas as categorias</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

          {/* CPF Inválido */}
          <button
            onClick={() => setFilterCpfInvalido(v => !v)}
            style={{
              fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5,
              border: filterCpfInvalido ? '2px solid #ef4444' : '1px solid var(--border)',
              background: filterCpfInvalido ? '#fee2e2' : 'transparent',
              color: filterCpfInvalido ? '#dc2626' : 'var(--text3)',
              cursor: 'pointer', transition: 'all .15s'
            }}
          >
            <AlertCircle size={11} /> CPF Incompleto
          </button>

          {/* Contador */}
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>
            {filtrados.length} de {associados.length} registros
          </span>
        </div>
      </div>

      {/* ── Tabela ── */}
      <DataTable 
        columns={columns} 
        data={filtrados} 
        loading={loading} 
        getRowClassName={(item: any) => {
          const digits = (item.cpf || '').replace(/\D/g, '')
          return digits.length < 11 ? '!bg-red-50/60 border-l-4 border-red-500/50 transition-all' : ''
        }}
      />

      <CrudModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Associado' : 'Novo Associado'}
        initialData={editingItem}
        onSubmit={handleSalvar}
        fields={[
          { name: 'nome', label: 'Nome / Razão Social', type: 'text', required: true },
          { name: 'cpf', label: 'CPF / CNPJ', type: 'text', placeholder: 'Apenas números ou formatado' },
          { name: 'codigo', label: 'Código (Matrícula)', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'text', required: true },
          { name: 'telefone', label: 'Telefone / WhatsApp', type: 'text' },
          { name: 'mensalidade', label: 'Mensalidade (R$)', type: 'number', required: true },
          { name: 'data_ingresso', label: 'Data de Ingresso', type: 'date', required: true },
          { name: 'categoria', label: 'Categoria', type: 'select', required: true, options: [
            { value: 'Pleno', label: 'Pleno' },
            { value: 'Premium', label: 'Premium' },
            { value: 'Corporativo', label: 'Corporativo' },
            { value: 'Estudante', label: 'Estudante' },
            { value: 'Isento', label: 'Isento' },
          ]},
          { name: 'status', label: 'Status', type: 'select', required: true, options: [
            { value: 'ativo', label: 'Ativo (Adimplente)' },
            { value: 'inadimplente', label: 'Inadimplente' },
            { value: 'inativo', label: 'Inativo' },
          ]},
          { name: 'vencimento_dia', label: 'Dia de Vencimento', type: 'select', required: true, options: [
            { value: '10', label: 'Dia 10' },
            { value: '20', label: 'Dia 20' },
          ]},
        ]}
      />
    </div>
  )
}
