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
        {/* Search and action buttons removed by user request */}

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
