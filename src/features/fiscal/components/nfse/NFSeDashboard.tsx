
'use client'
import React, { useState } from 'react'
import { FileText, Clock, CheckCircle, TrendingUp, DollarSign, BarChart3, Trash2, Lock, X } from 'lucide-react'
import DataTable from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import { fmtR, fmtData } from '@/lib/utils/formatters'
import { deletarNFSeAction } from '../../actions/nfseActions'

const SENHA_EXCLUSAO = '19072425'

function ModalSenha({ 
  onConfirm, 
  onCancel, 
  count 
}: { 
  onConfirm: () => void
  onCancel: () => void
  count: number 
}) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (senha !== SENHA_EXCLUSAO) {
      setErro('Senha incorreta. Operação não autorizada.')
      return
    }
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[380px] flex flex-col gap-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <Lock size={18} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm">Confirmar Exclusão</h3>
              <p className="text-[11px] text-slate-400">{count} nota{count > 1 ? 's' : ''} será{count > 1 ? 'ão' : ''} excluída{count > 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Esta operação é <strong>irreversível</strong>. Digite a senha de administrador para confirmar.
        </p>

        <div className="flex flex-col gap-1">
          <input
            type="password"
            placeholder="Senha de administrador"
            value={senha}
            onChange={(e) => { setSenha(e.target.value); setErro('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            autoFocus
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
          />
          {erro && <p className="text-[11px] text-red-500 font-bold px-1">{erro}</p>}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-black text-slate-500 hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !senha}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-xl text-xs font-black text-white transition-all"
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NFSeDashboard({ nfseHook, onEscriturar }: { nfseHook: any; onEscriturar: (id: string) => void }) {
  const { stats, nfses, loading } = nfseHook

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [modalTarget, setModalTarget] = useState<string[] | null>(null) // IDs a excluir

  const allSelected = nfses.length > 0 && selected.size === nfses.length
  const someSelected = selected.size > 0

  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(nfses.map((n: any) => n.id)))
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const pedirExclusao = (ids: string[]) => setModalTarget(ids)

  const confirmarExclusao = async () => {
    if (!modalTarget) return
    const result = await deletarNFSeAction(modalTarget)
    if (result.success) {
      setSelected(new Set())
      nfseHook.refresh()
    } else {
      alert(`Erro ao excluir: ${result.error}`)
    }
    setModalTarget(null)
  }

  const kpis = [
    { label: 'Total NFS-e', value: stats.total, icon: FileText, color: '#6366f1', sub: 'Serviços Tomados' },
    { label: 'Pendentes', value: stats.pendentes, icon: Clock, color: '#f59e0b', sub: 'Aguardando Escrituração' },
    { label: 'Escrituradas', value: stats.concluidas, icon: CheckCircle, color: '#10b981', sub: 'Processadas' },
    { label: 'Total Bruto', value: fmtR(stats.valorTotal), icon: DollarSign, color: '#8b5cf6', sub: 'Valor das Notas' },
    { label: 'Retenções', value: fmtR(stats.valorRetencoes), icon: TrendingUp, color: '#f43f5e', sub: 'IRRF, PCC, ISS' },
  ]

  const columns = [
    {
      header: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
          title="Selecionar todas"
        />
      ),
      key: 'select',
      render: (n: any) => (
        <input
          type="checkbox"
          checked={selected.has(n.id)}
          onChange={() => toggleOne(n.id)}
          className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />
      )
    },
    { 
      header: 'Data', 
      key: 'data_emissao', 
      render: (n: any) => <span className="text-[11px] font-bold text-slate-500">{fmtData(n.data_emissao)}</span> 
    },
    { 
      header: 'Número', 
      key: 'numero_nfse', 
      render: (n: any) => <span className="font-black text-slate-800">{n.numero_nfse}</span> 
    },
    { 
      header: 'Prestador', 
      key: 'prestador', 
      render: (n: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-700 truncate max-w-[200px]">{n.prestador?.nome || 'N/A'}</span>
          <span className="text-[10px] text-slate-400">{n.prestador?.cpf_cnpj || ''}</span>
        </div>
      )
    },
    { 
      header: 'Valor Bruto', 
      key: 'valor_bruto', 
      render: (n: any) => <span className="font-black text-slate-700">{fmtR(n.valor_bruto)}</span> 
    },
    { 
      header: 'Valor Líquido', 
      key: 'valor_liquido', 
      render: (n: any) => <span className="font-black text-blue-600">{fmtR(n.valor_liquido)}</span> 
    },
    { 
      header: 'Status', 
      key: 'status_escrituracao', 
      render: (n: any) => (
        <StatusBadge 
          type="lancamento"
          status={n.status_escrituracao === 'concluida' ? 'pago' : 'pendente'}
        />
      )
    },
    {
      header: 'Ações',
      key: 'acoes',
      render: (n: any) => (
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onEscriturar(n.id)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
            title="Escriturar Nota"
          >
            <FileText size={15} />
          </button>
          <button 
            onClick={() => pedirExclusao([n.id])}
            className="p-2 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500 transition-colors"
            title="Excluir Nota"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {modalTarget && (
        <ModalSenha
          count={modalTarget.length}
          onConfirm={confirmarExclusao}
          onCancel={() => setModalTarget(null)}
        />
      )}

      {/* KPIs */}
      <div className="flex flex-row flex-nowrap gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <div key={i} className="bg-white border border-slate-100 p-4 rounded-[20px] shadow-sm hover:shadow-md transition-all flex-1 min-w-[160px]">
              <div className="flex items-center gap-2 mb-2 opacity-60">
                <Icon size={14} style={{ color: kpi.color }} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</span>
              </div>
              <div className="text-xl font-black text-slate-800" style={{ color: i > 2 ? kpi.color : undefined }}>
                {kpi.value}
              </div>
              <div className="text-[10px] font-bold text-slate-400 mt-1">{kpi.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Lista de Notas */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-500" />
            Notas Fiscais de Serviços Recentes
          </h2>
          
          <div className="flex items-center gap-2">
            {someSelected && (
              <button
                onClick={() => pedirExclusao(Array.from(selected))}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-black rounded-xl transition-all shadow-sm"
              >
                <Trash2 size={13} />
                Excluir {selected.size} selecionada{selected.size > 1 ? 's' : ''}
              </button>
            )}
            <select 
              value={nfseHook.periodo} 
              onChange={(e) => nfseHook.setPeriodo(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 outline-none hover:border-blue-300 transition-all cursor-pointer shadow-sm"
            >
              <option value="all">Ver Todas</option>
              {Array.from({ length: 12 }).map((_, i) => {
                const d = new Date()
                d.setMonth(d.getMonth() - i)
                const val = d.toISOString().slice(0, 7)
                const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                return <option key={val} value={val}>{label.charAt(0).toUpperCase() + label.slice(1)}</option>
              })}
            </select>
          </div>
        </div>

        <DataTable 
          columns={columns} 
          data={nfses} 
          loading={loading}
          getRowClassName={(n: any) => n.status_escrituracao === 'concluida' ? 'opacity-60' : ''}
        />
      </div>
    </div>
  )
}
