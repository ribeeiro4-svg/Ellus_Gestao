'use client'
import React from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Usuario, Diretor, Associado } from '@/lib/types'

interface FiltrosTarefasProps {
  responsaveis: { id: string, nome: string }[]
  associados: Associado[]
  filtros: any
  setFiltros: (f: any) => void
  onClear: () => void
}

export default function FiltrosTarefas({ responsaveis, associados, filtros, setFiltros, onClear }: FiltrosTarefasProps) {
  const categories = ['Financeiro', 'Vendas', 'Operacional', 'TI', 'Administrativo', 'Outros']

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a2419]/60 backdrop-blur-3xl p-6 rounded-[32px] border border-white/5 shadow-2xl animate-in fade-in duration-500">
      <div className="flex flex-1 items-center gap-3 bg-white/5 border border-white/5 p-1.5 rounded-2xl shadow-inner max-w-md">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <Search size={18} />
        </div>
        <input 
          type="text"
          placeholder="Buscar tarefas por título..."
          value={filtros.search || ''}
          onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
          className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-white placeholder:text-emerald-500/30"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Responsável */}
        <select
          value={filtros.responsavel_id || ''}
          onChange={(e) => setFiltros({ ...filtros, responsavel_id: e.target.value })}
          className="bg-white/5 border border-white/5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all cursor-pointer"
        >
          <option value="" className="bg-[#0a2419]">Todos os Responsáveis</option>
          {responsaveis.map(r => <option key={r.id} value={r.id} className="bg-[#0a2419]">{r.nome.toUpperCase()}</option>)}
        </select>

        {/* Associado */}
        <select
          value={filtros.associado_id || ''}
          onChange={(e) => setFiltros({ ...filtros, associado_id: e.target.value })}
          className="bg-white/5 border border-white/5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all cursor-pointer"
        >
          <option value="" className="bg-[#0a2419]">Todos os Associados</option>
          {associados.map(a => <option key={a.id} value={a.id} className="bg-[#0a2419]">{a.nome.toUpperCase()}</option>)}
        </select>

        {/* Prioridade */}
        <select
          value={filtros.prioridade || ''}
          onChange={(e) => setFiltros({ ...filtros, prioridade: e.target.value })}
          className="bg-white/5 border border-white/5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all cursor-pointer"
        >
          <option value="" className="bg-[#0a2419]">Todas as Prioridades</option>
          <option value="Alta" className="bg-[#0a2419]">Alta</option>
          <option value="Média" className="bg-[#0a2419]">Média</option>
          <option value="Baixa" className="bg-[#0a2419]">Baixa</option>
        </select>

        {/* Categoria */}
        <select
          value={filtros.categoria || ''}
          onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
          className="bg-white/5 border border-white/5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all cursor-pointer"
        >
          <option value="" className="bg-[#0a2419]">Todas as Categorias</option>
          {categories.map(c => <option key={c} value={c} className="bg-[#0a2419]">{c.toUpperCase()}</option>)}
        </select>

        {/* Datas */}
        <div className="flex items-center gap-2">
          <input 
            type="date"
            value={filtros.data_inicio || ''}
            onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
            className="bg-white/5 border border-white/5 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all cursor-pointer"
            title="Data Início"
          />
          <span className="text-emerald-500/30 font-bold text-[10px]">ATÉ</span>
          <input 
            type="date"
            value={filtros.data_fim || ''}
            onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
            className="bg-white/5 border border-white/5 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all cursor-pointer"
            title="Data Fim"
          />
        </div>

        {/* Limpar Filtros */}
        <button 
          onClick={onClear}
          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-400 transition-all active:scale-90 border border-white/5"
          title="Limpar Filtros"
        >
          <X size={18} />
        </button>
      </div>
      <style jsx>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(65%) sepia(55%) saturate(450%) hue-rotate(110deg) brightness(95%) contrast(90%);
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
