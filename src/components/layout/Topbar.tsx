'use client'
import { usePathname, useRouter } from 'next/navigation'
import { Download, FileText, Bell, Search, User, Trash2, ChevronRight } from 'lucide-react'
import { useSearch } from '@/lib/contexts/SearchContext'

const TITLES: Record<string, string> = {
  '/':              'Apresentação',
  '/resumo':         'Dashboard',
  '/financeiro':    'Financeiro',
  '/receitas':      'Receitas',
  '/despesas':      'Despesas',
  '/associados':    'Associados',
  '/fornecedores':  'Fornecedores',
  '/inadimplencia': 'Inadimplência',
  '/metas':         'Metas',
  '/projetos':      'Projetos',
  '/evolucao':      'Evolução',
  '/importar':      'Importar',
  '/simulador':     'Simulador Estratégico',
  '/diretoria':     'Gestão da Diretoria',
  '/fechamento':   'Fechamento Mensal',
  '/configuracoes': 'Configurações',
  '/conciliacao':   'Conciliação Bancária',
}

export default function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { searchTerm, setSearchTerm, setFilterType, setFilterStatus } = useSearch()
  
  const title = TITLES[pathname] || 'Dashboard'

  const handleClear = () => {
    setSearchTerm('')
    setFilterType('todos')
    setFilterStatus('todos')
  }

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
        <div className="hidden lg:flex items-center bg-white rounded-lg px-4 py-2 gap-3 border border-slate-200 focus-within:ring-4 focus-within:ring-[var(--accent)]/5 focus-within:border-[var(--accent)] transition-all w-72 shadow-sm">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar em tudo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-[12.5px] text-slate-700 placeholder:text-slate-400 w-full font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={handleClear}
             className="btn btn-secondary w-[38px] h-[38px] p-0 flex items-center justify-center shadow-lg shadow-emerald-900/40"
             title="Limpar Todos os Filtros"
           >
             <Trash2 strokeWidth={2.5} className="w-5 h-5 min-w-[20px] min-h-[20px] flex-shrink-0 text-white" />
           </button>
           <button 
             className="btn btn-secondary w-[38px] h-[38px] p-0 flex items-center justify-center relative shadow-lg shadow-emerald-900/40"
             title="Notificações"
           >
             <Bell strokeWidth={2.5} className="w-5 h-5 min-w-[20px] min-h-[20px] flex-shrink-0 text-white" />
             <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#ff3333] rounded-full border-2 border-[#1d4f3e]"></span>
           </button>
        </div>

        <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>

        <div className="flex items-center gap-3">
           <button 
             onClick={() => router.push('/importar')}
             className="btn btn-secondary h-[38px] px-5 shadow-lg shadow-emerald-900/40"
           >
             <Download strokeWidth={2.5} className="w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex-shrink-0 text-white" />
             <span className="font-black">Importar</span>
           </button>
           
           <button 
             onClick={() => window.print()}
             className="btn btn-primary h-[38px] px-5 shadow-lg shadow-emerald-900/40"
           >
             <FileText strokeWidth={2.5} className="w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex-shrink-0 text-white" />
             <span className="font-black">Exportar PDF</span>
           </button>
        </div>
      </div>
    </header>
  )
}
