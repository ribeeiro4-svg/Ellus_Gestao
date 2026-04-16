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
    <header className="h-20 border-b border-slate-200 bg-white sticky top-0 z-40 px-10 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          <span>ACPROBEC</span>
          <ChevronRight size={12} className="text-slate-300" />
          <span className="text-[#4f7ef8]">{title}</span>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="hidden lg:flex items-center bg-slate-50 rounded-xl px-4 py-2.5 gap-3 border border-slate-200 focus-within:ring-4 focus-within:ring-[#4f7ef8]/5 transition-all w-80">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar registros..." 
            className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full font-medium"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
             <button 
               className="p-2.5 text-slate-400 hover:text-[#ef4444] hover:bg-red-50 rounded-xl transition-all"
               title="Limpar Filtros"
             >
               <Trash2 size={18} />
             </button>
             <button 
               className="p-2.5 text-slate-400 hover:text-[#4f7ef8] hover:bg-blue-50 rounded-xl transition-all relative"
               title="Notificações"
             >
               <Bell size={18} />
               <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#ef4444] rounded-full border-2 border-white"></span>
             </button>
          </div>

          <div className="flex items-center gap-3">
             <button 
               onClick={() => router.push('/importar')}
               className="flex items-center gap-2 bg-white text-slate-700 text-xs font-bold px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
             >
               <Download size={14} className="text-slate-400" />
               <span>Importar</span>
             </button>
             
             <button 
               onClick={() => window.print()}
               className="flex items-center gap-2 bg-[#4f7ef8] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#3d65d4] transition-all shadow-lg shadow-blue-500/20 active:scale-95"
             >
               <FileText size={14} />
               <span>Exportar PDF</span>
             </button>
          </div>
        </div>
      </div>
    </header>
  )
}
