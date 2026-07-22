'use client'
import React, { useState } from 'react'
import { ComunicadoHistorico } from '@/lib/hooks/useComunicados'
import { Download, Search, History, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { exportToExcel, exportToPDF } from '@/lib/exportUtils'

interface HistoricoComunicadosProps {
  historico: ComunicadoHistorico[]
  loading: boolean
  onUpdateStatus?: (ids: string[], novoStatus: string) => Promise<any>
}

export default function HistoricoComunicados({ historico, loading, onUpdateStatus }: HistoricoComunicadosProps) {
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroTemplate, setFiltroTemplate] = useState('todos')
  
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isUpdating, setIsUpdating] = useState(false)

  const templatesUnicos = Array.from(new Set(historico.map(h => h.template_nome))).filter(Boolean)

  const historicoFiltrado = historico.filter(h => {
    if (filtroStatus !== 'todos' && h.status !== filtroStatus) return false
    if (filtroTemplate !== 'todos' && h.template_nome !== filtroTemplate) return false
    if (busca) {
      const b = busca.toLowerCase()
      if (
        !h.associado_nome.toLowerCase().includes(b) && 
        !h.usuario_nome.toLowerCase().includes(b)
      ) return false
    }
    return true
  })

  const formatarDataHora = (d?: string) => {
    if (!d) return '-'
    try {
      const data = new Date(d)
      return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return '-'
    }
  }

  const handleExportarExcel = () => {
    const data = historicoFiltrado.map(h => ({
      'Data/Hora': formatarDataHora(h.data_envio),
      'Associado': h.associado_nome,
      'Telefone': h.associado_telefone,
      'Template': h.template_nome,
      'Responsável': h.usuario_nome,
      'Status': h.status === 'iniciado' || h.status === 'enviado' ? 'Comunicado Iniciado' : 'Falha'
    }))
    exportToExcel(data, 'Historico_Comunicados')
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(historicoFiltrado.map(h => h.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id))
    }
  }

  const handleMarcarFalha = async () => {
    if (!onUpdateStatus || selectedIds.length === 0) return
    if (!confirm(`Deseja marcar ${selectedIds.length} envio(s) como Falha / Não Enviado?`)) return
    
    setIsUpdating(true)
    await onUpdateStatus(selectedIds, 'falha_manual')
    setSelectedIds([])
    setIsUpdating(false)
  }

  return (
    <div className="flex flex-col gap-6">

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Barra de pesquisa no topo */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative w-full max-w-2xl">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar histórico por nome do associado ou responsável..."
              className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-slate-50 focus:bg-white"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-700">
            <History size={18} />
            <h3 className="font-bold text-sm uppercase tracking-wider">Histórico de Comunicações</h3>
            
            {selectedIds.length > 0 && (
              <span className="ml-2 text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                {selectedIds.length} selecionado(s)
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length > 0 && onUpdateStatus && (
              <button
                onClick={handleMarcarFalha}
                disabled={isUpdating}
                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 rounded-lg flex items-center gap-1.5 uppercase tracking-wider transition-colors mr-2"
              >
                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                Marcar como Falha
              </button>
            )}
            <select
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              value={filtroTemplate}
              onChange={e => setFiltroTemplate(e.target.value)}
            >
              <option value="todos">Todos os Templates</option>
              {templatesUnicos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value)}
            >
              <option value="todos">Todos os Status</option>
              <option value="iniciado">Sucesso (Iniciado)</option>
              <option value="falha_sem_telefone">Falha (Sem telefone)</option>
              <option value="falha_manual">Falha (Manual / Não enviado)</option>
            </select>

            <button
              onClick={handleExportarExcel}
              className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg flex items-center gap-1.5 uppercase tracking-wider transition-colors ml-auto"
            >
              <Download size={14} /> Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-[10px] uppercase bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    checked={historicoFiltrado.length > 0 && selectedIds.length === historicoFiltrado.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 whitespace-nowrap">Data/Hora</th>
                <th className="px-4 py-3 whitespace-nowrap">Associado</th>
                <th className="px-4 py-3 whitespace-nowrap">Telefone</th>
                <th className="px-4 py-3 whitespace-nowrap">Template Utilizado</th>
                <th className="px-4 py-3 whitespace-nowrap">Responsável</th>
                <th className="px-4 py-3 whitespace-nowrap text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 size={32} className="animate-spin text-amber-500" />
                      <span className="text-xs uppercase tracking-widest font-bold">Carregando histórico...</span>
                    </div>
                  </td>
                </tr>
              ) : historicoFiltrado.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <span className="text-xs uppercase tracking-widest font-bold">Nenhum registro encontrado.</span>
                  </td>
                </tr>
              ) : (
                historicoFiltrado.map(h => (
                  <tr key={h.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${selectedIds.includes(h.id) ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        checked={selectedIds.includes(h.id)}
                        onChange={(e) => handleSelectRow(h.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">{formatarDataHora(h.data_envio)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{h.associado_nome}</td>
                    <td className="px-4 py-3 text-xs font-mono">{h.associado_telefone}</td>
                    <td className="px-4 py-3 text-xs">{h.template_nome}</td>
                    <td className="px-4 py-3 text-xs">{h.usuario_nome}</td>
                    <td className="px-4 py-3 text-center">
                      {h.status === 'iniciado' || h.status === 'enviado' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          <CheckCircle2 size={12} /> Sucesso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Falha
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
