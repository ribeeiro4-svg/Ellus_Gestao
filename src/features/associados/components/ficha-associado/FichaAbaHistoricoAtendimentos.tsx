import React from 'react'
import { Clock, Calendar, User, FileText } from 'lucide-react'

interface FichaAbaHistoricoAtendimentosProps {
  atendimentos: any[]
}

export default function FichaAbaHistoricoAtendimentos({ atendimentos }: FichaAbaHistoricoAtendimentosProps) {
  if (!atendimentos || atendimentos.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Clock size={40} className="text-slate-300" />
        <p className="text-sm font-bold">Nenhum atendimento registrado para este associado.</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Histórico de Atendimentos</h3>
        <div className="h-px bg-slate-100 flex-1" />
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/70 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Data e Hora</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Responsável Presencial</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {atendimentos.map((a, idx) => {
                const dataAtendimento = a.data_agendamento ? new Date(a.data_agendamento) : a.created_at ? new Date(a.created_at) : null
                const isAgendado = !!a.responsavel_id
                const responsavelPresencial = a.responsavel_setor || '--'
                const observacao = a.etapas_concluidas?.observacao || '--'

                return (
                  <tr key={a.id || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {dataAtendimento ? (
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-800 font-bold">
                            {dataAtendimento.toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {dataAtendimento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ) : '--'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        a.is_cobranca
                          ? 'bg-orange-100 text-orange-700 border border-orange-200/50'
                          : isAgendado 
                            ? 'bg-purple-100 text-purple-700 border border-purple-200/50' 
                            : 'bg-teal-100 text-teal-700 border border-teal-200/50'
                      }`}>
                        {a.is_cobranca ? 'Cobrança' : isAgendado ? 'Agendamento' : 'Avulso'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <User size={12} className="text-slate-400" />
                        <span>{responsavelPresencial}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        a.status === 'agendado' ? 'bg-amber-100 text-amber-700' :
                        a.status === 'em_andamento' ? 'bg-blue-100 text-blue-700' :
                        a.status === 'concluido' ? 'bg-emerald-100 text-emerald-700' :
                        a.status === 'cancelado' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {a.status === 'em_andamento' ? 'Em Andamento' : a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-xs font-medium text-slate-600" title={observacao}>
                      <div className="flex items-center gap-1">
                        <FileText size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{observacao}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
