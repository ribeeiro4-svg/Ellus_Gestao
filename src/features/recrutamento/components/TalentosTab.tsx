'use client'
import React, { useState } from 'react'
import { 
  Database, 
  Search, 
  Filter, 
  GraduationCap, 
  Building, 
  Star,
  ExternalLink,
  Mail,
  Phone,
  Calendar
} from 'lucide-react'
import { useCandidatos } from '@/lib/hooks/useCandidatos'
import { fmtData } from '@/lib/utils/formatters'
import type { Candidato } from '@/lib/types'
import CandidatoDossier from '@/components/recrutamento/CandidatoDossier'

export default function TalentosTab() {
  const { candidatos, loading } = useCandidatos()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCandidato, setSelectedCandidato] = useState<Candidato | null>(null)

  // Filtramos apenas candidatos que estão no banco de talentos ou reprovados
  const talentos = candidatos.filter(c => 
    (c.status === 'banco_talentos' || c.status === 'reprovado' || c.status === 'inscrito') &&
    (c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.curso?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.instituicao?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="flex flex-col flex-1 gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Database className="text-[#2d8c6f]" size={20} /> Banco de Talentos
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium italic">
            Consulte candidatos com potencial para futuras oportunidades.
          </p>
        </div>
      </div>

      {/* Toolbar de Busca */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, curso ou instituição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-white border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-emerald-500/30 transition-all shadow-sm"
          />
        </div>
        <button className="h-12 px-6 bg-white border border-slate-100 rounded-2xl text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-all flex items-center gap-3">
          <Filter size={16} />
          Filtros Avançados
        </button>
      </div>

      {/* Grid de Talentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-40 bg-slate-50 rounded-3xl animate-pulse border border-slate-100"></div>
          ))
        ) : talentos.map(talento => (
          <div key={talento.id} className="bg-white p-6 rounded-[32px] border border-slate-100 hover:shadow-xl transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 px-4 py-1 text-[8px] font-black uppercase tracking-widest ${talento.status === 'banco_talentos' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
              {talento.status.replace('_', ' ')}
            </div>

            <div className="flex gap-6">
              <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 overflow-hidden shrink-0">
                {talento.foto_url ? <img src={talento.foto_url} className="w-full h-full object-cover" /> : <Database size={32} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800 truncate">{talento.nome}</h3>
                  {talento.nota_final && (
                    <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                      <span className="text-[11px] font-black text-amber-700">{talento.nota_final.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-y-2 mt-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <GraduationCap size={14} />
                    <span className="text-[10px] font-bold uppercase truncate">{talento.curso || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Building size={14} />
                    <span className="text-[10px] font-bold uppercase truncate">{talento.instituicao || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar size={14} />
                    <span className="text-[10px] font-bold uppercase truncate">{talento.created_at ? fmtData(talento.created_at) : '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
               <div className="flex gap-3">
                 {talento.email && (
                   <a href={`mailto:${talento.email}`} className="p-2.5 bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all" title={talento.email}>
                     <Mail size={16} />
                   </a>
                 )}
                 {talento.telefone && (
                   <a href={`tel:${talento.telefone}`} className="p-2.5 bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all" title={talento.telefone}>
                     <Phone size={16} />
                   </a>
                 )}
               </div>
               <button 
                 onClick={() => setSelectedCandidato(talento)}
                 className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-all"
               >
                 Ver Dossiê Completo
                 <ExternalLink size={12} />
               </button>
            </div>
          </div>
        ))}
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
