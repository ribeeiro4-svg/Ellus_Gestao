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
import { Plus, Users, Mail, Phone } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

export default function AssociadosPage() {
  const { associados, loading, inserir, atualizar, remover } = useAssociados()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [searchQ, setSearchQ] = useState('')

  /* ── Dados para gráficos ── */
  const ativos = useMemo(() => associados.filter(a => (a.status || '').toLowerCase().includes('ativ')).length, [associados])
  const inadimplentes = useMemo(() => associados.filter(a => (a.status || '').toLowerCase().includes('inadimp')).length, [associados])
  const inativos = useMemo(() => associados.filter(a => (a.status || '').toLowerCase().includes('inat')).length, [associados])

  const catMap = useMemo(() => {
    const m: Record<string, number> = {}
    associados.forEach(a => { const c = a.categoria || 'Sem categoria'; m[c] = (m[c] || 0) + 1 })
    return Object.keys(m).length ? m : { 'Sem dados': 1 }
  }, [associados])

  const filtrados = useMemo(() =>
    searchQ
      ? associados.filter(a => JSON.stringify(a).toLowerCase().includes(searchQ.toLowerCase()))
      : associados,
    [associados, searchQ]
  )

  /* ── CRUD helpers ── */
  const handleSalvar = async (data: any) => {
    if (editingItem) { await atualizar(editingItem.id, data) }
    else { await inserir({ ...data, status: data.status || 'ativo' }) }
  }
  const handleEdit = (item: any) => { setEditingItem(item); setIsModalOpen(true) }
  const handleDelete = async (id: string) => {
    if (confirm('Excluir este associado?')) await remover(id)
  }

  const barFontSm = { size: 10 }

  /* ── Colunas ── */
  const columns = [
    {
      header: 'Associado', key: 'nome',
      render: (i: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(45,140,111,.12)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, border: '1.5px solid rgba(45,140,111,.2)' }}>
            {(i.nome || 'A')[0].toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>{i.nome}</span>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>#{i.codigo}</span>
              {i.cpf && <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500 }}>• {i.cpf}</span>}
            </div>
          </div>
        </div>
      )
    },
    { header: 'Categoria', key: 'categoria', render: (i: any) => <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{i.categoria}</span> },
    { header: 'Mensalidade', key: 'mensalidade', render: (i: any) => <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)' }}>{fmtR(i.mensalidade)}</span> },
    { header: 'Status', key: 'status', render: (i: any) => <StatusBadge status={i.status} type="associado" /> },
    {
      header: 'Contato', key: 'email',
      render: (i: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text3)' }}>
          <span title={i.email} style={{ cursor: 'pointer', display: 'flex' }}><Mail size={14} /></span>
          {i.telefone && <span title={i.telefone} style={{ cursor: 'pointer', display: 'flex' }}><Phone size={14} /></span>}
        </div>
      )
    },
    {
      header: '', key: 'acoes', className: 'w-20 text-right',
      render: (i: any) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => handleEdit(i)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
          </button>
          <button onClick={() => handleDelete(i.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
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
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(79,126,248,.1)', border: '1px solid rgba(79,126,248,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f7ef8' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="page-title">Associados</div>
            <div className="page-subtitle">Gestão da carteira de associados — ACPROBEC</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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

      {/* Busca */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text3)', flexShrink: 0 }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        <input
          type="text"
          placeholder="Buscar por nome, código ou email..."
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--text1)', width: '100%', fontFamily: 'inherit' }}
        />
        {searchQ && <button onClick={() => setSearchQ('')} style={{ color: 'var(--text3)', cursor: 'pointer', fontSize: 12, border: 'none', background: 'none' }}>✕</button>}
      </div>

      {/* ── Tabela ── */}
      <DataTable columns={columns} data={filtrados} loading={loading} />

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
        ]}
      />
    </div>
  )
}
