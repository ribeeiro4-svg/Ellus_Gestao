'use client'
import React, { useState } from 'react'
import { 
  Users, 
  Search, 
  Filter, 
  User, 
  Mail, 
  Phone, 
  ExternalLink,
  ChevronRight,
  TrendingDown,
  GraduationCap
} from 'lucide-react'
import { useCandidatos } from '@/lib/hooks/useCandidatos'
import { useVagas } from '@/lib/hooks/useVagas'
import { fmtData } from '@/lib/utils/formatters'
import type { Candidato } from '@/lib/types'
import CandidatoDossier from '@/components/recrutamento/CandidatoDossier'

export default function CandidatosTab() {
  const { candidatos, loading } = useCandidatos()
  const { vagas } = useVagas()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCandidato, setSelectedCandidato] = useState<Candidato | null>(null)

  const filteredCandidatos = candidatos.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.curso?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getVagaNome = (id: string) => {
    return vagas.find(v => v.id === id)?.titulo || 'Sem Vaga'
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'contratacao': return 'bg-emerald-100 text-emerald-700'
      case 'inscrito': return 'bg-indigo-100 text-indigo-700'
      case 'escolaridade_validada': return 'bg-blue-100 text-blue-700'
      case 'entrevista_adm': return 'bg-amber-100 text-amber-700'
      case 'entrevista_dir': return 'bg-orange-100 text-orange-700'
      case 'reprovado': return 'bg-rose-100 text-rose-700'
      case 'banco_talentos': return 'bg-purple-100 text-purple-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="flex flex-col flex-1 gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="text-[#2d8c6f]" size={20} /> Base Geral de Candidatos
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium italic">
            Visualize e gerencie todos os talentos cadastrados no portal.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, e-mail ou curso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-white border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-emerald-500/30 transition-all shadow-sm"
          />
        </div>
        <button className="h-12 px-6 bg-white border border-slate-100 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-all flex items-center gap-3">
          <Filter size={16} />
          Filtros
        </button>
      </div>

      {/* Tabela de Candidatos */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidato</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vaga</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Inscrição</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-4"><div className="h-4 bg-slate-50 rounded w-full"></div></td>
                </tr>
              ))
            ) : filteredCandidatos.map(cand => (
              <tr key={cand.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-100 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
                      {cand.foto_url ? <img src={cand.foto_url} className="w-full h-full object-cover" /> : <User size={18} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{cand.nome}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate">{cand.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-600 line-clamp-1">{getVagaNome(cand.vaga_id || '')}</span>
                    <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter flex items-center gap-1">
                      <GraduationCap size={10} />
                      {cand.curso || 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusStyle(cand.status)}`}>
                    {cand.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[11px] font-bold text-slate-400">
                    {cand.created_at ? fmtData(cand.created_at) : '—'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setSelectedCandidato(cand)}
                    className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all opacity-0 group-hover:opacity-100 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                  >
                    Ver Dossiê
                    <ExternalLink size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && filteredCandidatos.length === 0 && (
          <div className="py-20 text-center opacity-30">
            <Users size={48} className="mx-auto mb-4" />
            <p className="text-[11px] font-black uppercase tracking-widest">Nenhum candidato encontrado nesta busca</p>
          </div>
        )}
      </div>

      {selectedCandidato && (
        <CandidatoDossier 
          candidato={selectedCandidato} 
          onClose={() => setSelectedCandidato(null)} 
        />
      )}
    </div>
  )
}
