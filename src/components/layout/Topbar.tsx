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
        {/* All action buttons removed by user request */}
      </div>
    </header>
  )
}
