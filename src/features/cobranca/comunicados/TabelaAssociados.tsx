'use client'
import React from 'react'
import { Associado } from '@/lib/types'
import { CheckSquare, Square, Loader2, CheckCircle2, Clock } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { ComunicadoHistorico } from '@/lib/hooks/useComunicados'

interface TabelaAssociadosProps {
  associados: Associado[]
  loading: boolean
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  historico?: ComunicadoHistorico[]
  selectedTemplateId?: string | null
}

export default function TabelaAssociados({ 
  associados, 
  loading, 
  selectedIds, 
  onSelectionChange,
  historico,
  selectedTemplateId
}: TabelaAssociadosProps) {
  
  const handleSelectAll = () => {
    if (selectedIds.length === associados.length && associados.length > 0) {
      onSelectionChange([])
    } else {
      onSelectionChange(associados.map(a => a.id))
    }
  }

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(selected => selected !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  const formatarData = (d?: string) => {
    if (!d) return '-'
    try {
      const data = new Date(d)
      return data.toLocaleDateString('pt-BR')
    } catch {
      return '-'
    }
  }

  const formatarCpf = (cpf?: string) => {
    if (!cpf) return '-'
    const c = cpf.replace(/\D/g, '')
    if (c.length === 11) {
      return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    if (c.length === 14) {
      return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    return cpf
  }

  const formatarTelefone = (tel?: string) => {
    if (!tel) return '-'
    const t = tel.replace(/\D/g, '')
    if (t.length === 11) {
      return t.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    return tel
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wider">Resultados da Pesquisa</h3>
        <div className="flex gap-4 items-center">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {associados.length} Encontrados
          </span>
          <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-wider">
            {selectedIds.length} Selecionados
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="text-xs uppercase bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 w-10 text-center">
                <button 
                  onClick={handleSelectAll}
                  className="text-slate-400 hover:text-amber-500 transition-colors focus:outline-none"
                >
                  {associados.length > 0 && selectedIds.length === associados.length ? (
                    <CheckSquare size={18} className="text-amber-500" />
                  ) : (
                    <Square size={18} />
                  )}
                </button>
              </th>
              <th className="px-3 py-3 font-bold text-left">Nome</th>
              <th className="px-2 py-3 whitespace-nowrap text-center">Envio</th>
              <th className="px-2 py-3 whitespace-nowrap">WhatsApp</th>
              <th className="px-2 py-3 whitespace-nowrap">Plano de Saúde</th>
              <th className="px-2 py-3 whitespace-nowrap text-center">Status</th>
              <th className="px-2 py-3 whitespace-nowrap text-center">Data Ingresso</th>
              <th className="px-2 py-3 whitespace-nowrap text-center">Venc.</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="animate-spin text-amber-500" />
                    <span className="text-xs uppercase tracking-widest font-bold">Carregando associados...</span>
                  </div>
                </td>
              </tr>
            ) : associados.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  <span className="text-xs uppercase tracking-widest font-bold">Nenhum associado encontrado para os filtros atuais.</span>
                </td>
              </tr>
            ) : (
              associados.map(assoc => {
                const isSelected = selectedIds.includes(assoc.id)
                
                let jaFoiComunicado = false
                if (historico && historico.length > 0) {
                  if (selectedTemplateId) {
                    jaFoiComunicado = historico.some(h => h.associado_id === assoc.id && h.template_id === selectedTemplateId)
                  } else {
                    jaFoiComunicado = historico.some(h => h.associado_id === assoc.id)
                  }
                }

                return (
                  <tr key={assoc.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isSelected ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button 
                        onClick={() => handleSelectOne(assoc.id)}
                        className="text-slate-400 hover:text-amber-500 transition-colors focus:outline-none"
                      >
                        {isSelected ? (
                          <CheckSquare size={18} className="text-amber-500" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-3 font-medium text-slate-800 break-words min-w-[200px]">{assoc.nome}</td>
                    <td className="px-2 py-3 text-center whitespace-nowrap">
                      {jaFoiComunicado ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                          <CheckCircle2 size={12} /> OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500">
                          <Clock size={12} /> Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3 font-mono text-xs whitespace-nowrap">{formatarTelefone(assoc.telefone)}</td>
                    <td className="px-2 py-3 whitespace-nowrap">{assoc.plano_saude || '-'}</td>
                    <td className="px-2 py-3 text-center whitespace-nowrap">
                      <StatusBadge status={assoc.status} type="associado" />
                    </td>
                    <td className="px-2 py-3 text-center text-xs whitespace-nowrap">{formatarData(assoc.data_ingresso)}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700 whitespace-nowrap">
                      {assoc.vencimento_dia ? `Dia ${assoc.vencimento_dia}` : '-'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <button
          onClick={handleSelectAll}
          className="text-[11px] font-bold uppercase tracking-wider text-amber-600 hover:text-amber-700 hover:bg-amber-100/50 px-3 py-1.5 rounded-lg transition-colors"
        >
          {associados.length > 0 && selectedIds.length === associados.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
        </button>
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Total Selecionado: <span className="text-amber-600 ml-1">{selectedIds.length}</span>
        </span>
      </div>
    </div>
  )
}
