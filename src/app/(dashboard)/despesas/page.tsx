'use client'
import React, { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import CrudModal from '@/components/ui/CrudModal'
import PaymentBadge from '@/components/ui/PaymentBadge'
import ChartCard from '@/components/ui/ChartCard'
import { fmtR, fmtData, MESES } from '@/lib/utils/formatters'
import { TrendingDown, Plus, Copy, ChevronDown, ChevronRight } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler)

const CHART_COLORS = ['#e07b39', '#f59e0b', '#c084fc', '#22d3ee', '#2d8c6f', '#34d399', '#f43f5e']

const axisDefaults = {
  y: {
    grid: { color: 'rgba(0,0,0,.04)' },
    ticks: { font: { size: 10 }, callback: (v: any) => 'R$' + Math.round(Number(v) / 1000) + 'k' },
  },
  x: { grid: { display: false }, ticks: { font: { size: 10 } } },
}

export default function DespesasPage() {
  const { lancamentos, loading, inserir, atualizar, remover } = useFinanceiro()
  const despesas = useMemo(() => lancamentos.filter(l => l.tipo === 'despesa'), [lancamentos])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['__all__']))

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }
  const expandAll = () => setExpandedGroups(new Set([...despesasPorCategoria.keys()]))
  const collapseAll = () => setExpandedGroups(new Set())

  /* ── Dados para gráficos ── */
  const despesaMensal = useMemo(() => {
    const arr = Array(12).fill(0)
    despesas.forEach(d => {
      const m = new Date(d.data).getMonth()
      if (!isNaN(m)) arr[m] += d.valor || 0
    })
    return arr
  }, [despesas])

  const despesaCats = useMemo(() => {
    const m: Record<string, number> = {}
    despesas.forEach(d => { const c = d.categoria || 'Outros'; m[c] = (m[c] || 0) + (d.valor || 0) })
    return Object.keys(m).length ? m : { 'Sem dados': 1 }
  }, [despesas])

  const totalDespesas = despesas.reduce((s, d) => s + (d.valor || 0), 0)

  /* ── CRUD helpers ── */
  const handleSalvar = async (data: any) => {
    if (editingItem) { await atualizar(editingItem.id, data) }
    else { await inserir({ ...data, tipo: 'despesa', status: data.status || 'aberto' }) }
  }
  const handleEdit = (item: any) => { setEditingItem(item); setIsModalOpen(true) }
  const handleDuplicate = (item: any) => {
    const { id, ...rest } = item
    setEditingItem(rest)
    setIsModalOpen(true)
  }
  const handleDelete = async (id: string) => {
    if (confirm('Excluir esta despesa?')) await remover(id)
  }

  /* ── Agrupamento por categoria ── */
  const despesasPorCategoria = useMemo(() => {
    const groups = new Map<string, { items: any[] }>()
    despesas.forEach(d => {
      const key = d.categoria || 'Sem Categoria'
      if (!groups.has(key)) groups.set(key, { items: [] })
      groups.get(key)!.items.push(d)
    })
    return new Map([...groups.entries()].sort(([, a], [, b]) => {
      const tA = a.items.reduce((s, i) => s + (i.valor || 0), 0)
      const tB = b.items.reduce((s, i) => s + (i.valor || 0), 0)
      return tB - tA
    }))
  }, [despesas])

  /* ── Colunas da tabela ── */
  const columns = [
    { header: 'Data', key: 'data', render: (i: any) => <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>{fmtData(i.data)}</span> },
    {
      header: 'Descrição', key: 'descricao', render: (i: any) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>{i.descricao}</span>
          <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>{i.categoria}</span>
        </div>
      )
    },
    { header: 'Valor', key: 'valor', render: (i: any) => <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--red)' }}>-{fmtR(i.valor)}</span> },
    { header: 'Status', key: 'status', render: (i: any) => <StatusBadge status={i.status} type="lancamento" /> },
    { header: 'Pagamento', key: 'forma_pagamento', render: (i: any) => <PaymentBadge method={i.forma_pagamento} /> },
    {
      header: '', key: 'acoes', className: 'w-20 text-right',
      render: (i: any) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => handleDuplicate(i)} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors" title="Duplicar">
            <Copy size={14} />
          </button>
          <button onClick={() => handleEdit(i)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="Editar">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
          </button>
          <button onClick={() => handleDelete(i.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Excluir">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
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
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
            <TrendingDown size={24} />
          </div>
          <div>
            <div className="page-title">Despesas</div>
            <div className="page-subtitle">Saídas financeiras — ACPROBEC</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Total</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--red)' }}>-{fmtR(totalDespesas)}</div>
          </div>
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true) }} className="btn" style={{ background: 'var(--red)', color: '#fff', padding: '10px 20px', fontSize: 13, borderRadius: 'var(--radius-sm)', boxShadow: '0 2px 8px rgba(239,68,68,.35)' }}>
            <Plus size={16} /> Nova Despesa
          </button>
        </div>
      </div>

      {/* ── Gráficos ── */}
      <div className="charts-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <ChartCard title="📊 Despesas por Mês" subtitle="Evolução mensal das saídas">
          <Bar
            data={{
              labels: MESES,
              datasets: [{
                label: 'Despesa',
                data: despesaMensal,
                backgroundColor: 'rgba(224,123,57,.72)',
                borderRadius: 5,
                borderSkipped: false,
              }]
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: axisDefaults,
            }}
          />
        </ChartCard>

        <ChartCard title="🍩 Mix por Categoria" subtitle="Distribuição das despesas">
          <Doughnut
            data={{
              labels: Object.keys(despesaCats),
              datasets: [{
                data: Object.values(despesaCats),
                backgroundColor: CHART_COLORS,
                hoverOffset: 6,
                borderWidth: 2,
                borderColor: '#fff',
              }]
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              cutout: '65%',
              plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10, padding: 14, font: { size: 11 } } }
              }
            }}
          />
        </ChartCard>
      </div>

      {/* ── Agrupado por Categoria ── */}
      <div className="table-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/40">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {despesasPorCategoria.size} categorias &bull; {despesas.length} lançamentos
          </span>
          <div className="flex items-center gap-3">
            <button onClick={expandAll} className="text-[10px] font-bold text-rose-500 hover:underline">Expandir todos</button>
            <span className="text-gray-200">|</span>
            <button onClick={collapseAll} className="text-[10px] font-bold text-gray-400 hover:underline">Recolher todos</button>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-sm text-gray-400">Carregando...</div>
        ) : despesas.length === 0 ? (
          <div className="p-16 text-center text-sm text-gray-400">Nenhuma despesa encontrada.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {[...despesasPorCategoria.entries()].map(([categoria, { items }]) => {
              const isOpen = expandedGroups.has(categoria)
              const total = items.reduce((s, i) => s + (i.valor || 0), 0)
              const initials = categoria.substring(0, 2).toUpperCase()
              return (
                <div key={categoria}>
                  <div
                    onClick={() => toggleGroup(categoria)}
                    className="flex items-center gap-4 px-5 py-3.5 cursor-pointer select-none hover:bg-rose-50/30 transition-all group"
                    style={{ background: isOpen ? 'rgba(239,68,68,.03)' : 'transparent' }}
                  >
                    <div className="text-gray-400 group-hover:text-rose-500 transition-colors">
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(239,68,68,.08)', border: '2px solid rgba(239,68,68,.18)',
                      color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 900
                    }}>{initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-800">{categoria}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{items.length} lançamento(s)</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-rose-600">-{fmtR(total)}</div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-widest">acumulado</div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-dashed border-gray-100">
                      {items.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map((i: any) => (
                        <div key={i.id} className="group flex items-center gap-4 py-3 hover:bg-gray-50/60 transition-all border-b border-gray-50 last:border-0" style={{ paddingLeft: 60, paddingRight: 20 }}>
                          <div className="w-20 shrink-0">
                            <span className="text-[11px] font-semibold text-gray-500">{fmtData(i.data)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold text-gray-700 truncate">{i.descricao}</div>
                          </div>
                          <div className="shrink-0">
                            {i.forma_pagamento && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">{i.forma_pagamento}</span>
                            )}
                          </div>
                          <div className="w-24 text-right shrink-0">
                            <span className="text-[13px] font-black text-rose-600">-{fmtR(i.valor)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button onClick={() => handleDuplicate(i)} className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors" title="Duplicar"><Copy size={13} /></button>
                            <button onClick={() => handleEdit(i)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="Editar">
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(i.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Excluir">
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <CrudModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Despesa' : 'Nova Despesa'}
        initialData={editingItem}
        onSubmit={handleSalvar}
        fields={[
          { name: 'descricao', label: 'Descrição', type: 'text', required: true },
          { name: 'valor', label: 'Valor (R$)', type: 'number', required: true },
          { name: 'data', label: 'Data', type: 'date', required: true },
          { name: 'categoria', label: 'Categoria', type: 'select', required: true, options: [
            { value: 'Folha', label: 'Folha de Pagamento' },
            { value: 'Impostos', label: 'Impostos e Taxas' },
            { value: 'Infraestrutura', label: 'Infraestrutura' },
            { value: 'Marketing', label: 'Marketing' },
            { value: 'Eventos', label: 'Eventos / Palestras' },
            { value: 'Suprimentos', label: 'Suprimentos / Outros' },
          ]},
          { name: 'status', label: 'Status', type: 'select', required: true, options: [
            { value: 'pago', label: 'Pago' },
            { value: 'aberto', label: 'Aberto / Pendente' },
            { value: 'atrasado', label: 'Atrasado' },
          ]},
          { name: 'forma_pagamento', label: 'Forma de Pagamento', type: 'select', options: [
            { value: 'Dinheiro', label: 'Dinheiro' },
            { value: 'PIX', label: 'PIX' },
            { value: 'Boleto', label: 'Boleto' },
            { value: 'Transferência', label: 'Transferência' },
            { value: 'Cartão', label: 'Cartão' },
          ]},
        ]}
      />
    </div>
  )
}
