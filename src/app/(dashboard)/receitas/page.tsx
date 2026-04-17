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
import CrudModal from '@/components/ui/CrudModal'
import PaymentBadge from '@/components/ui/PaymentBadge'
import ChartCard from '@/components/ui/ChartCard'
import { fmtR, fmtData, MESES } from '@/lib/utils/formatters'
import { TrendingUp, Plus, RefreshCw, Copy } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler)

const CHART_COLORS = ['#2d8c6f', '#34d399', '#f59e0b', '#e07b39', '#c084fc', '#22d3ee', '#f43f5e']

const axisDefaults = {
  y: {
    grid: { color: 'rgba(0,0,0,.04)' },
    ticks: { font: { size: 10 }, callback: (v: any) => 'R$' + Math.round(Number(v) / 1000) + 'k' },
  },
  x: { grid: { display: false }, ticks: { font: { size: 10 } } },
}

export default function ReceitasPage() {
  const { lancamentos, loading, inserir, atualizar, remover } = useFinanceiro()
  const { contas } = useContas()
  const { associados } = useAssociados()
  const receitas = useMemo(() => lancamentos.filter(l => l.tipo === 'receita'), [lancamentos])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  /* ── Dados para gráficos ── */
  const receitaMensal = useMemo(() => {
    const arr = Array(12).fill(0)
    receitas.forEach(r => {
      const m = new Date(r.data).getMonth()
      if (!isNaN(m)) arr[m] += r.valor || 0
    })
    return arr
  }, [receitas])

  const receitaCats = useMemo(() => {
    const m: Record<string, number> = {}
    receitas.forEach(r => { const c = r.categoria || 'Outros'; m[c] = (m[c] || 0) + (r.valor || 0) })
    return Object.keys(m).length ? m : { 'Sem dados': 1 }
  }, [receitas])

  const totalReceitas = receitas.reduce((s, r) => s + (r.valor || 0), 0)

  /* ── CRUD helpers ── */
  const handleSalvar = async (data: any) => {
    if (editingItem) { await atualizar(editingItem.id, data) }
    else { await inserir({ ...data, tipo: 'receita', status: data.status || 'pago' }) }
  }
  const handleEdit = (item: any) => { setEditingItem(item); setIsModalOpen(true) }
  const handleDuplicate = (item: any) => {
    const { id, ...rest } = item
    setEditingItem(rest)
    setIsModalOpen(true)
  }
  const handleDelete = async (id: string) => {
    if (confirm('Excluir esta receita?')) await remover(id)
  }

  /* ── Colunas da tabela ── */
  const columns = [
    { header: 'Data', key: 'data', render: (i: any) => <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>{fmtData(i.data)}</span> },
    {
      header: 'Descrição', key: 'descricao', render: (i: any) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>{i.descricao}</span>
            {i.recorrencia_ativa && (
              <span className="flex items-center gap-1 text-[8px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                <RefreshCw size={8} /> ↺ Recorrente
              </span>
            )}
          </div>
          <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>{i.categoria}</span>
        </div>
      )
    },
    { 
      header: 'Conta', 
      key: 'conta_id', 
      render: (i: any) => {
        const conta = contas.find(c => c.id === i.conta_id)
        return (
          <div className="flex flex-col">
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>{conta?.nome || '—'}</span>
            <span style={{ fontSize: 8, color: 'var(--text3)', textTransform: 'uppercase' }}>{conta?.tipo.replace('_', ' ') || ''}</span>
          </div>
        )
      }
    },
    { 
      header: 'Associado', 
      key: 'associado_id', 
      render: (i: any) => {
        const assoc = associados.find(a => a.id === i.associado_id)
        return <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>{assoc?.nome || '—'}</span>
      }
    },
    { header: 'Valor', key: 'valor', render: (i: any) => <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--green)' }}>{fmtR(i.valor)}</span> },
    {
      header: 'Taxa Bancária', key: 'taxa_extraida', render: (i: any) => {
        const match = i.descricao.match(/\(Taxa: R\$\s*([^)]+)\)/)
        const taxaStr = match ? `R$ ${match[1]}` : 'R$ 0,00'
        return <span className={`text-[11px] font-black ${match ? 'text-amber-600' : 'text-gray-300'}`}>{taxaStr}</span>
      }
    },
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
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(45,140,111,.12)', border: '1px solid rgba(45,140,111,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="page-title">Receitas</div>
            <div className="page-subtitle">Entradas financeiras — ACPROBEC</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Total</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)' }}>{fmtR(totalReceitas)}</div>
          </div>
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true) }} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 13 }}>
            <Plus size={16} /> Nova Receita
          </button>
        </div>
      </div>

      {/* ── Gráficos ── */}
      <div className="charts-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <ChartCard title="📊 Receitas por Mês" subtitle="Evolução mensal das entradas">
          <Bar
            data={{
              labels: MESES,
              datasets: [{
                label: 'Receita',
                data: receitaMensal,
                backgroundColor: 'rgba(45,140,111,.72)',
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

        <ChartCard title="🍩 Mix por Categoria" subtitle="Distribuição das receitas">
          <Doughnut
            data={{
              labels: Object.keys(receitaCats),
              datasets: [{
                data: Object.values(receitaCats),
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

      {/* ── Tabela ── */}
      <DataTable columns={columns} data={receitas} loading={loading} />

      <CrudModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Receita' : 'Nova Receita'}
        initialData={editingItem}
        onSubmit={handleSalvar}
        fields={[
          { name: 'descricao', label: 'Descrição', type: 'text', required: true },
          { name: 'valor', label: 'Valor (R$)', type: 'number', required: true },
          { name: 'data', label: 'Data', type: 'date', required: true },
          { name: 'conta_id', label: 'Conta de Destino', type: 'select', required: true, options: [
            ...contas.map(c => ({ value: c.id, label: c.nome })),
            { value: '', label: 'Selecione uma conta' }
          ]},
          { name: 'categoria', label: 'Categoria', type: 'select', required: true, options: [
            { value: 'Mensalidades', label: 'Mensalidades' },
            { value: 'ADESÃO', label: 'Adesão' },
            { value: 'Patrocínios', label: 'Patrocínios' },
            { value: 'Eventos', label: 'Eventos' },
            { value: 'Serviços', label: 'Serviços' },
            { value: 'Outros', label: 'Outros' },
          ]},
          { name: 'associado_id', label: 'Associado Vinculado', type: 'select', options: [
            { value: '', label: 'Nenhum' },
            ...associados.map(a => ({ value: a.id, label: a.nome }))
          ]},
          { name: 'recorrencia_ativa', label: 'Lançamento Recorrente', type: 'checkbox', placeholder: 'Esta receita se repete mensalmente?' },
          { name: 'status', label: 'Status', type: 'select', required: true, options: [
            { value: 'pago', label: 'Recebido' },
            { value: 'pendente', label: 'Pendente' },
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
