'use client'
import { usePathname, useRouter } from 'next/navigation'
import { Download, FileText, Bell, Search, User, Trash2, ChevronRight } from 'lucide-react'

const TITLES: Record<string, string> = {
  '/':              'Dashboard',
  '/financeiro':    'Financeiro',
  '/receitas':      'Receitas',
  '/despesas':      'Despesas',
  '/associados':    'Associados',
  '/inadimplencia': 'Inadimplência',
  '/metas':         'Metas',
  '/projetos':      'Projetos',
  '/evolucao':      'Evolução',
  '/importar':      'Importar',
}

export default function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const title = TITLES[pathname] || 'Dashboard'

  return (
    <header className="topbar sticky top-0 z-40 px-6 h-[var(--topbar-h)] flex items-center justify-between">
      <div className="topbar-left flex items-center gap-[10px]">
        <div className="breadcrumb text-[12px] text-[var(--text3)] flex items-center gap-1.5 font-medium uppercase tracking-wider">
          ACPROBEC 
          <span className="breadcrumb-sep opacity-40">/</span> 
          <span className="text-[var(--text1)] font-bold text-[13px]">{title}</span>
        </div>
      </div>

      <div className="topbar-right flex items-center gap-[10px]">
        <div className="hidden lg:flex items-center bg-slate-50 rounded-lg px-4 py-2 gap-3 border border-slate-200 focus-within:ring-4 focus-within:ring-[var(--accent)]/5 transition-all w-72">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            className="bg-transparent border-none outline-none text-[12.5px] text-slate-700 placeholder:text-slate-400 w-full font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
           <button 
             className="btn btn-outline btn-icon w-[34px] h-[34px] p-0 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--text2)] hover:bg-[var(--surface2)] transition-all"
             title="Limpar Filtros"
           >
             <Trash2 size={16} />
           </button>
           <button 
             className="btn btn-outline btn-icon w-[34px] h-[34px] p-0 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--text2)] hover:bg-[var(--surface2)] transition-all relative"
             title="Notificações"
           >
             <Bell size={16} />
             <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-[#ef4444] rounded-full border border-white"></span>
           </button>
        </div>

        <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>

        <div className="flex items-center gap-2">
           <button 
             onClick={() => router.push('/importar')}
             className="btn btn-outline h-[34px] px-4 py-0 flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--text2)] hover:bg-[var(--surface2)] transition-all text-[12px] font-medium"
           >
             <Download size={14} />
             <span>Importar</span>
           </button>
           
           <button 
             onClick={() => window.print()}
             className="btn btn-primary h-[34px] px-4 py-0 flex items-center gap-2 rounded-[var(--radius-sm)] text-white text-[12px] font-medium transition-all"
           >
             <FileText size={14} />
             <span>Exportar PDF</span>
           </button>
        </div>
      </div>
    </header>
  )
}
