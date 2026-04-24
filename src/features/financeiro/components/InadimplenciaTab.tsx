'use client'
import React, { useMemo, useState } from 'react'
import { useAssociados } from '@/lib/hooks/useAssociados'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import DataTable from '@/components/ui/DataTable'
import ChartCard from '@/components/ui/ChartCard'
import { fmtR, fmtData, fmtPct } from '@/lib/utils/formatters'
import { AlertTriangle, TrendingDown, Users, ShieldAlert, Pencil, XCircle, Search, Trash2, Loader2, MessageCircle } from 'lucide-react'
import { 
  Chart as ChartJS, 
  ArcElement, Tooltip, Legend, 
  DoughnutController 
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import StatusBadge from '@/components/ui/StatusBadge'
import CrudModal, { Field } from '@/components/ui/CrudModal'
import PaymentBadge from '@/components/ui/PaymentBadge'
import { useContas } from '@/lib/hooks/useContas'

ChartJS.register(ArcElement, Tooltip, Legend, DoughnutController)

export default function InadimplenciaTab() {
  const { associados, loading: loadAssoc } = useAssociados()
  const { lancamentos, loading: loadFin, atualizar, remover, removerBulk } = useFinanceiro()
  const { contas } = useContas()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCleaning, setIsCleaning] = useState(false)

  // Lançamentos atrasados (detalhado) - Base de cálculo real
  const lancamentosAtrasados = useMemo(() => {
    return lancamentos.filter(l => 
        l.status === 'atrasado' || 
        (l.status === 'aberto' && new Date(l.data) < new Date())
    ).filter(l => {
        const searchLower = searchTerm.toLowerCase()
        const assoc = associados.find(a => a.id === l.associado_id)
        return !searchTerm || 
               l.descricao.toLowerCase().includes(searchLower) ||
               assoc?.nome.toLowerCase().includes(searchLower)
    })
  }, [lancamentos, searchTerm, associados])

  // Cálculos Automáticos
  const totalDevido = useMemo(() => 
    lancamentosAtrasados.reduce((acc, l) => acc + (l.valor || 0), 0),
  [lancamentosAtrasados])

  // Agrupamento de Inadimplentes baseado nos lançamentos reais da tabela
  const mappedInadimplentes = useMemo(() => {
    const map: Record<string, { assoc: any, meses: number, total: number }> = {}
    
    lancamentosAtrasados.forEach(l => {
      const aid = l.associado_id
      if (!aid) return
      if (!map[aid]) {
        const assoc = associados.find(a => a.id === aid)
        map[aid] = { assoc, meses: 0, total: 0 }
      }
      map[aid].meses += 1
      map[aid].total += (l.valor || 0)
    })

    return Object.values(map).sort((a, b) => b.meses - a.meses)
  }, [lancamentosAtrasados, associados])

  const ticketMedioAtraso = mappedInadimplentes.length > 0 ? totalDevido / mappedInadimplentes.length : 0
  const pctInadimpTotal = (mappedInadimplentes.length / (associados.length || 1)) * 100

  // Curva de atraso calculada dinamicamente
  const curva = useMemo(() => {
    let m1 = 0, m2 = 0, m3 = 0, m3plus = 0
    mappedInadimplentes.forEach(item => {
      const ms = item.meses
      if (ms === 1) m1++
      else if (ms === 2) m2++
      else if (ms === 3) m3++
      else if (ms > 3) m3plus++
    })
    return [m1, m2, m3, m3plus]
  }, [mappedInadimplentes])

  const handleEdit = (item: any) => { setEditingItem(item); setIsModalOpen(true) }
  const handleDelete = async (id: string) => { if (confirm('Excluir este lançamento?')) await remover(id) }

  const handleSalvar = async (data: any) => {
    if (editingItem) await atualizar(editingItem.id, data)
    setIsModalOpen(false)
    setEditingItem(null)
  }

  const handleCobrar = (assoc: any) => {
    if (!assoc) return
    // Filtrar todos os atrasos deste associado específico na base atual
    const atrasos = lancamentos.filter(l => 
      l.associado_id === assoc.id && 
      (l.status === 'atrasado' || (l.status === 'aberto' && new Date(l.data) < new Date()))
    )

    if (atrasos.length === 0) {
      alert('Nenhum boleto em atraso encontrado para este associado.')
      return
    }

    const listaBoletos = atrasos.map(l => {
      // Limpar a descrição: Pega apenas o que vem antes do primeiro "-" (caso tenha o nome do associado no texto)
      const descLimpa = l.descricao.split(' - ')[0].toUpperCase()
      return `📄 ${descLimpa} - ${fmtData(l.data)}`
    }).join('\n')

    const msg = `Olá, ${assoc.nome}! Tudo bem?\n\nPassando rapidinho pra te avisar que temos um ou mais boletos em aberto:\n\n${listaBoletos}\n\nSe já tiver pago, desconsidera essa mensagem 😊\n\nCaso contrário, posso te reenviar ou te ajudar com o que precisar!`
    
    const fone = assoc.telefone?.replace(/\D/g, '') || ''
    if (!fone) {
      alert('Associado sem telefone cadastrado.')
      return
    }

    // Usar 55 como prefixo do Brasil se não houver
    const finalPhone = fone.startsWith('55') ? fone : `55${fone}`
    const url = `https://web.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  const handleCleanupDuplicates = async () => {
    if (lancamentosAtrasados.length === 0) return
    if (!confirm(`Deseja remover mensalidades duplicadas na lista de inadimplência? O sistema manterá apenas um lançamento por associado/mês.`)) return

    setIsCleaning(true)
    try {
      // Agrupar por associado_id e Mes/Ano
      const groups: Record<string, any[]> = {}
      
      lancamentosAtrasados.forEach(l => {
        if (!l.associado_id || !l.data) return
        const d = new Date(l.data)
        const key = `${l.associado_id}_${d.getFullYear()}_${d.getMonth()}`
        if (!groups[key]) groups[key] = []
        groups[key].push(l)
      })

      const idsToDelete: string[] = []
      Object.values(groups).forEach(group => {
        if (group.length <= 1) return
        // Manter o primeiro, deletar o resto
        for (let i = 1; i < group.length; i++) {
          idsToDelete.push(group[i].id)
        }
      })

      if (idsToDelete.length === 0) {
        alert('Nenhuma duplicata identificada nesta lista.')
        return
      }

      const res = await removerBulk(idsToDelete)
      if (res.error) alert(`Erro: ${res.error}`)
      else alert(`Sucesso! ${idsToDelete.length} lançamentos duplicados removidos.`)
    } finally {
      setIsCleaning(false)
    }
  }

  const modalFields: Field[] = useMemo(() => [
    { name: 'descricao', label: 'Descrição', type: 'text', required: true },
    { name: 'valor', label: 'Valor (R$)', type: 'number', required: true },
    { name: 'data', label: 'Vencimento', type: 'date', required: true },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'pago', label: 'Recebido / Pago' }, { value: 'aberto', label: 'Aguardando' }, { value: 'atrasado', label: 'Em Atraso' }] },
    { name: 'conta_id', label: 'Conta', type: 'select', required: true, options: contas.map(c => ({ value: c.id, label: c.nome })) },
    { name: 'categoria', label: 'Categoria', type: 'text', required: true },
    { name: 'forma_pagamento', label: 'Forma de Pagamento', type: 'select', options: [{ value: 'PIX', label: 'PIX' }, { value: 'Boleto', label: 'Boleto' }, { value: 'Dinheiro', label: 'Dinheiro' }] },
  ], [contas])

  const columns = [
    { 
      header: 'Associado / Descrição', 
      key: 'descricao', 
      render: (i: any) => {
        const assoc = associados.find(a => a.id === i.associado_id)
        return (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900">{assoc?.nome || i.descricao}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{i.categoria} — Ref: {fmtData(i.data)}</span>
          </div>
        )
      }
    },
    { 
      header: 'Vencimento', 
      key: 'data', 
      render: (i: any) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-rose-500">{fmtData(i.data)}</span>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Vencido</span>
        </div>
      )
    },
    { 
      header: 'Valor', 
      key: 'valor', 
      render: (i: any) => <span className="text-sm font-black text-red-600">{fmtR(i.valor)}</span>
    },
    { header: 'Status', key: 'status', render: (i: any) => <StatusBadge status={i.status} type="lancamento" /> },
    { header: 'Pagamento', key: 'forma_pagamento', render: (i: any) => <PaymentBadge method={i.forma_pagamento} /> },
    { 
      header: '', key: 'acoes', className: 'w-24 text-right', 
      render: (i: any) => {
        const assoc = associados.find(a => a.id === i.associado_id)
        return (
          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => handleCobrar(assoc)} title="Cobrar via WhatsApp" className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
              <MessageCircle size={14} />
            </button>
            <button onClick={() => handleEdit(i)} title="Editar Lançamento" className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <Pencil size={14} />
            </button>
            <button onClick={() => handleDelete(i.id)} title="Excluir" className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
              <XCircle size={14} />
            </button>
          </div>
        )
      }
    },
  ]

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Vencido', value: fmtR(totalDevido), sub: `${lancamentosAtrasados.length} lançamentos pendentes`, icon: ShieldAlert, color: 'var(--red)' },
          { label: 'Indíce Geral', value: fmtPct(pctInadimpTotal), sub: 'da carteira de associados', icon: TrendingDown, color: 'var(--orange)' },
          { label: 'Ticket Médio', value: fmtR(ticketMedioAtraso), sub: 'por inadimplente', icon: Users, color: 'var(--text2)' },
          { label: 'Críticos (3+ Meses)', value: curva[3], sub: 'casos de alta inadimplência', icon: AlertTriangle, color: 'var(--red)' },
        ].map(k => (
          <div key={k.label} className="kpi-card bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm relative group transition-all hover:shadow-md hover:border-red-100">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight" style={{ color: k.color }}>{k.value}</h3>
              <p className="text-[10px] text-slate-400 mt-1 font-bold">{k.sub}</p>
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.05] group-hover:scale-110 group-hover:opacity-[0.1] transition-all duration-500">
               <k.icon size={40} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Gráfico e Alerta ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ChartCard title="Curva de Atraso" subtitle="Distribuição por meses vencidos">
            <div className="flex-1 w-[calc(100%+48px)] mx-[-24px] mb-[-24px] h-[340px]">
              <Doughnut 
                data={{
                  labels: ['1 Mês', '2 Meses', '3 Meses', '3+ Meses'],
                  datasets: [{
                    data: curva,
                    backgroundColor: ['#fcd34d', '#fb923c', '#ef4444', '#991b1b'],
                    borderWidth: 0,
                    hoverOffset: 20
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  layout: {
                    padding: {
                      top: 10,
                      bottom: 30,
                      left: 30,
                      right: 30
                    }
                  },
                  plugins: {
                    legend: { 
                      position: 'bottom', 
                      labels: { 
                        boxWidth: 8, 
                        font: { size: 9, weight: 'bold' as const }, 
                        padding: 15 
                      } 
                    }
                  },
                  cutout: '65%'
                }}
              />
            </div>
          </ChartCard>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 h-full flex flex-col">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[2px] mb-6 flex items-center gap-2">
               <ShieldAlert size={18} className="text-red-500" /> Associados em Situação Crítica
            </h4>
            <div className="flex-1 space-y-4">
               {mappedInadimplentes.slice(0, 3).map((item, idx) => (
                 <div key={item.assoc?.id || idx} className="flex items-center justify-between p-5 bg-red-50/20 rounded-2xl border border-red-100/30 hover:bg-red-50/40 transition-colors">
                    <div className="flex items-center gap-5">
                       <div className="w-8 h-8 rounded-full bg-red-100/50 flex items-center justify-center font-black text-red-600 text-[10px]">#{idx+1}</div>
                       <div>
                          <p className="text-sm font-black text-slate-900">{item.assoc?.nome || 'Associado não identificado'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.meses} meses em atraso</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-base font-black text-red-600">{fmtR(item.total)}</p>
                       <button 
                         onClick={() => handleCobrar(item.assoc)}
                         className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors mt-1"
                       >
                         Acionar Cobrança
                       </button>
                    </div>
                 </div>
               ))}
               {mappedInadimplentes.length === 0 && (
                 <div className="flex-1 flex items-center justify-center text-slate-300 italic text-sm">
                    Nenhum inadimplente encontrado. Parabéns!
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lançamentos em Atraso</h4>
                <button 
                  onClick={handleCleanupDuplicates}
                  disabled={isCleaning || lancamentosAtrasados.length === 0}
                  className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all disabled:opacity-50"
                >
                  {isCleaning ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Limpar Duplicados (Inadimplência)
                </button>
            </div>
            <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Buscar associado ou descrição..." 
                    className="w-full pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl text-xs outline-none focus:ring-4 ring-red-500/5 transition-all font-bold text-slate-700"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        <DataTable columns={columns} data={lancamentosAtrasados} loading={loadFin || loadAssoc} />
      </div>

      <CrudModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Editar Lançamento Vencido" initialData={editingItem} onSubmit={handleSalvar} fields={modalFields} />
    </div>
  )
}
