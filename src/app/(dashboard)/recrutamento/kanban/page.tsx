'use client'
import React, { useState } from 'react'
import { 
  FileCheck, 
  Search, 
  Filter, 
  ArrowRight, 
  User, 
  GraduationCap, 
  ShieldCheck,
  MoreVertical,
  ChevronRight,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Database
} from 'lucide-react'
import { useCandidatos } from '@/lib/hooks/useCandidatos'
import { useVagas } from '@/lib/hooks/useVagas'
import type { Candidato, StatusCandidato } from '@/lib/types'
import CandidatoDossier from '@/components/recrutamento/CandidatoDossier'

const COLUNAS: { key: StatusCandidato; label: string; color: string }[] = [
  { key: 'inscrito', label: 'Inscritos', color: 'bg-indigo-500' },
  { key: 'escolaridade_validada', label: 'Escolaridade', color: 'bg-emerald-500' },
  { key: 'entrevista_adm', label: 'Entrevista Adm', color: 'bg-blue-500' },
  { key: 'entrevista_dir', label: 'Diretoria', color: 'bg-amber-500' },
  { key: 'contratacao', label: 'Fila Contratação', color: 'bg-[#0e2d22]' },
  { key: 'banco_talentos', label: 'Banco Talentos', color: 'bg-purple-500' },
  { key: 'reprovado', label: 'Reprovados', color: 'bg-rose-500' },
]

export default function KanbanPage() {
  const { vagas } = useVagas()
  const [selectedVaga, setSelectedVaga] = useState<string>('')
  const { candidatos, loading, atualizar } = useCandidatos(selectedVaga || undefined)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCandidato, setSelectedCandidato] = useState<Candidato | null>(null)

  const filteredCandidatos = candidatos.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getCandidatosPorStatus = (status: StatusCandidato) => {
    return filteredCandidatos.filter(c => c.status === status)
  }

  // KPIs
  const totalInscritos = candidatos.length
  const naFilaContratacao = candidatos.filter(c => c.status === 'contratacao').length
  const taxaConversao = totalInscritos > 0 ? (naFilaContratacao / totalInscritos) * 100 : 0

  return (
    <div className="flex flex-col flex-1 gap-8 animate-in fade-in duration-500 h-full overflow-hidden">
      {/* ... Cabeçalho e Toolbar ... */}
      <div className="page-header flex justify-between items-center shrink-0">
        <div>
          <h1 className="page-title text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <FileCheck className="text-[#2d8c6f]" />
            Painel Kanban
          </h1>
          <p className="page-subtitle text-xs text-gray-500 mt-1 font-medium italic">
            Acompanhe o funil de recrutamento e a evolução de cada candidato.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingDown size={18} className="rotate-180" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Taxa de Conversão Final</p>
              <h4 className="text-xl font-black text-slate-900 leading-none mt-1.5">{taxaConversao.toFixed(1)}%</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center shrink-0">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Buscar candidato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-11 pr-4 bg-white border border-slate-100 rounded-xl text-sm outline-none focus:border-emerald-500/20 transition-all"
          />
        </div>
        <select 
          value={selectedVaga}
          onChange={(e) => setSelectedVaga(e.target.value)}
          className="h-11 px-6 bg-white border border-slate-100 rounded-xl text-[11px] font-black uppercase tracking-widest text-[#0e2d22] outline-none cursor-pointer"
        >
          <option value="">Todas as Vagas</option>
          {vagas.map(v => (
            <option key={v.id} value={v.id}>{v.titulo}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent pb-4">
        <div className="flex gap-6 h-full pb-2">
          {COLUNAS.map(col => (
            <div key={col.key} className="flex flex-col w-[300px] min-w-[300px] h-full bg-slate-50/50 rounded-[32px] border border-slate-100/50 p-4">
              <div className="flex items-center justify-between mb-5 px-2">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.color}`}></div>
                  <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{col.label}</h3>
                </div>
                <span className="text-[10px] font-black text-slate-400 bg-white px-2.5 py-1 rounded-full border border-slate-100">
                  {getCandidatosPorStatus(col.key).length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 px-1 custom-scrollbar">
                {getCandidatosPorStatus(col.key).map(cand => (
                  <div 
                    key={cand.id}
                    onClick={() => setSelectedCandidato(cand)}
                    className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-500/20 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 font-bold overflow-hidden border border-slate-100">
                        {cand.foto_url ? <img src={cand.foto_url} className="w-full h-full object-cover" /> : <User size={20} />}
                      </div>
                      <button className="p-1.5 text-slate-300 hover:text-slate-600 rounded-lg">
                        <MoreVertical size={14} />
                      </button>
                    </div>

                    <h4 className="text-sm font-bold text-slate-700 tracking-tight leading-tight mb-1">{cand.nome}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">{cand.curso || 'CURSO NÃO INFORMADO'}</p>

                    {/* Scores e Indicadores */}
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex gap-2">
                         {cand.nota_final && (
                           <div className="flex flex-col">
                             <span className="text-[8px] font-black text-slate-300 uppercase">Nota Final</span>
                             <span className={`text-[11px] font-black ${cand.nota_final >= 8 ? 'text-emerald-500' : 'text-slate-700'}`}>{cand.nota_final.toFixed(1)}</span>
                           </div>
                         )}
                      </div>
                      <div className="flex -space-x-1">
                        {cand.status === 'contratacao' && <CheckCircle2 size={16} className="text-emerald-500" />}
                        {cand.status === 'reprovado' && <XCircle size={16} className="text-rose-500" />}
                        {cand.status === 'banco_talentos' && <Database size={16} className="text-purple-500" />}
                      </div>
                    </div>
                  </div>
                ))}

                {getCandidatosPorStatus(col.key).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 opacity-20 filter grayscale">
                     <FileCheck size={32} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>

      {selectedCandidato && (
        <CandidatoDossier 
          candidato={selectedCandidato} 
          onClose={() => setSelectedCandidato(null)} 
        />
      )}
    </div>
  )
}
