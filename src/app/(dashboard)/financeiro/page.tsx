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
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import CrudModal from '@/components/ui/CrudModal'
import PaymentBadge from '@/components/ui/PaymentBadge'
import ChartCard from '@/components/ui/ChartCard'
import { fmtR, fmtData, MESES } from '@/lib/utils/formatters'
import { Plus, BarChart2, RefreshCw } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler)

export default function FinanceiroPage() {
  const { lancamentos, loading, inserir, atualizar, remover } = useFinanceiro()
  const { contas } = useContas()
  const { associados } = useAssociados()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  /* ── Dados para gráficos ── */
  const { recMensal, despMensal } = useMemo(() => {
    const rec = Array(12).fill(0)
    const desp = Array(12).fill(0)
    lancamentos.forEach(r => {
      const m = new Date(r.data).getMonth()
      if (isNaN(m)) return
      const v = r.valor || 0
      if (r.tipo === 'receita') rec[m] += v
      else desp[m] += v
    })
    return { recMensal: rec, despMensal: desp }
  }, [lancamentos])

  const resultMensal = recMensal.map((v, i) => v - despMensal[i])
  
  const recAcum = useMemo(() => {
    return recMensal.reduce<number[]>((arr, v) => { arr.push((arr[arr.length - 1] || 0) + v); return arr }, [])
  }, [recMensal])

  const margens = recMensal.map((v, i) => v > 0 ? Math.round((v - despMensal[i]) / v * 100) : 0)

  const { totalRec, totalDesp, saldoCaixa, saldoBanco } = useMemo(() => {
    let tr = 0, td = 0, sc = 0, sb = 0
    lancamentos.forEach(l => {
      const v = l.valor || 0
      if (l.tipo === 'receita') {
        tr += v
        if (l.forma_pagamento === 'Dinheiro') sc += v
        else sb += v
      } else {
        td += v
        if (l.forma_pagamento === 'Dinheiro') sc -= v
        else sb -= v
      }
    })
    return { totalRec: tr, totalDesp: td, saldoCaixa: sc, saldoBanco: sb }
  }, [lancamentos])

  const resultado = totalRec - totalDesp

  /* ── CRUD helpers ── */
  const handleSalvar = async (data: any) => {
    if (editingItem) { await atualizar(editingItem.id, data) }
    else { await inserir({ ...data, status: data.status || 'aberto' }) }
  }
  const handleEdit = (item: any) => { setEditingItem(item); setIsModalOpen(true) }
  const handleDelete = async (id: string) => {
    if (confirm('Excluir este lançamento?')) await remover(id)
  }

  const fontSm = { size: 10 }
  const gridFaint = { color: 'rgba(0,0,0,.04)' }

  /* ── Colunas ── */
  const columns = [
    { header: 'Data', key: 'data', render: (i: any) => <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>{fmtData(i.data)}</span> },
    {
      header: 'Descrição', key: 'descricao', render: (i: any) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>{i.descricao}</span>
          <div className="flex gap-2">
            <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>{i.categoria}</span>
            {i.recorrencia_ativa && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 rounded uppercase">
                <RefreshCw size={8} /> Recorrente
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Conta', key: 'conta_id', render: (i: any) => {
        const c = contas.find(ca => ca.id === i.conta_id)
        return <span className="text-[11px] font-bold text-gray-500 uppercase">{c?.nome || '--'}</span>
      }
    },
    {
      header: 'Associado', key: 'associado_id', render: (i: any) => {
        const a = associados.find(as => as.id === i.associado_id)
        return <span className="text-[11px] font-bold text-gray-700">{a?.nome || '--'}</span>
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
        <span style={{ fontSize: 13, fontWeight: 800, color: i.tipo === 'receita' ? 'var(--green)' : 'var(--red)' }}>
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
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(45,140,111,.12)', border: '1px solid rgba(45,140,111,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <BarChart2 size={24} />
          </div>
          <div>
            <div className="page-title">Fluxo de Caixa</div>
            <div className="page-subtitle">Gestão diferenciada de Caixa e Bancos — ACPROBEC</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Mini KPIs no header */}
          {[
            { label: '💰 Em Caixa', value: fmtR(saldoCaixa), color: 'var(--accent)' },
            { label: '🏦 Conta Bancária', value: fmtR(saldoBanco), color: 'var(--blue)' },
            { label: '📊 Resultado Total', value: fmtR(Math.abs(resultado)), color: resultado >= 0 ? 'var(--green)' : 'var(--red)' },
          ].map(k => (
            <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 16px', textAlign: 'center', minWidth: 120 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{k.label}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true) }} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 13 }}>
            <Plus size={16} /> Novo Lançamento
          </button>
        </div>
      </div>

      {/* ── Gráficos ── */}
      <div className="charts-grid">
        <ChartCard title="📊 Receita × Despesa Mensal" subtitle="Comparativo mês a mês com resultado">
          <Chart
            type="bar"
            data={{
              labels: MESES,
              datasets: [
                { type: 'bar' as const, label: 'Receita', data: recMensal, backgroundColor: 'rgba(45,140,111,.72)', borderRadius: 5 },
                { type: 'bar' as const, label: 'Despesa', data: despMensal, backgroundColor: 'rgba(239,100,72,.65)', borderRadius: 5 },
                { type: 'line' as const, label: 'Resultado', data: resultMensal, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,.1)', tension: 0.4, fill: true, borderWidth: 2, pointRadius: 3 },
              ]
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: fontSm } } },
              scales: {
                y: { grid: gridFaint, ticks: { font: fontSm, callback: (v: any) => 'R$' + Math.round(Number(v) / 1000) + 'k' } },
                x: { grid: { display: false }, ticks: { font: fontSm } },
              },
            }}
          />
        </ChartCard>

        <ChartCard title="📈 Receita Acumulada + Margem %" subtitle="Evolução do acumulado e margem mensal">
          <Line
            data={{
              labels: MESES,
              datasets: [
                { label: 'Acumulado', data: recAcum, borderColor: '#2d8c6f', backgroundColor: 'rgba(45,140,111,.12)', tension: 0.4, fill: true, borderWidth: 2, pointRadius: 3, yAxisID: 'y' },
                { label: 'Margem %', data: margens, borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,.08)', tension: 0.4, fill: false, borderWidth: 2, pointRadius: 3, borderDash: [4, 4], yAxisID: 'y2' },
              ]
            }}
            options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: fontSm } } },
              scales: {
                y: { position: 'left', grid: gridFaint, ticks: { font: fontSm, callback: (v: any) => 'R$' + Math.round(Number(v) / 1000) + 'k' } },
                y2: { position: 'right', grid: { display: false }, ticks: { font: fontSm, callback: (v: any) => v + '%' }, max: 100, min: -20 },
                x: { grid: { display: false }, ticks: { font: fontSm } },
              },
            }}
          />
        </ChartCard>
      </div>

      {/* ── Tabela ── */}
      <DataTable columns={columns} data={lancamentos} loading={loading} />

      <CrudModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Lançamento' : 'Novo Lançamento'}
        initialData={editingItem}
        onSubmit={handleSalvar}
        fields={[
          { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [
            { value: 'receita', label: 'Receita (Entrada)' },
            { value: 'despesa', label: 'Despesa (Saída)' },
          ]},
          { name: 'descricao', label: 'Descrição', type: 'text', required: true },
          { name: 'valor', label: 'Valor (R$)', type: 'number', required: true },
          { name: 'data', label: 'Data', type: 'date', required: true },
          { name: 'categoria', label: 'Categoria', type: 'select', required: true, options: [
            { value: 'Mensalidades', label: 'Mensalidades' },
            { value: 'ADESÃO', label: 'Adesão' },
            { value: 'Patrocínios', label: 'Patrocínios' },
            { value: 'Eventos', label: 'Eventos' },
            { value: 'Serviços', label: 'Serviços' },
            { value: 'Outros', label: 'Outros' },
          ]},
          { 
            name: 'conta_id', 
            label: 'Conta Bancária / Destino', 
            type: 'select', 
            required: true,
            options: contas.map(c => ({ value: c.id, label: c.nome }))
          },
          { name: 'status', label: 'Status', type: 'select', required: true, options: [
            { value: 'pago', label: 'Pago / Recebido' },
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
          { 
            name: 'valor_recebido', 
            label: 'Valor Recebido (R$)', 
            type: 'number', 
            showIf: (f) => f.forma_pagamento === 'Dinheiro',
            placeholder: 'Para cálculo de troco'
          },
          { 
            name: 'troco_via_pix', 
            label: 'Troco em PIX?', 
            type: 'checkbox', 
            showIf: (f) => f.forma_pagamento === 'Dinheiro' && f.valor_recebido > f.valor,
            placeholder: 'Devolver troco via PIX'
          },
          { 
            name: 'recorrencia_ativa', 
            label: 'Recorrência Ativa?', 
            type: 'checkbox',
          },
          { 
            name: 'associado_id', 
            label: 'Associado Vinculado', 
            type: 'select',
            options: [
              { value: '', label: 'Nenhum' },
              ...associados.map(a => ({ value: a.id, label: a.nome }))
            ]
          },
        ]}
      />
    </div>
  )
}
