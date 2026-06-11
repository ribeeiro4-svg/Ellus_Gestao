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
  
  const isGestaoTarefas = pathname === '/gestao-tarefas'
  const isDashboard = pathname === '/resumo'
  const isDarkBg = isGestaoTarefas || isDashboard
  const title = TITLES[pathname] || 'Dashboard'

  const handleClear = () => {
    setSearchTerm('')
    setFilterType('todos')
    setFilterStatus('todos')
  }

  return (
    <header className={`topbar sticky top-0 z-40 px-6 h-[var(--topbar-h)] flex items-center justify-between transition-all duration-500 ${
      isGestaoTarefas ? 'bg-[#04140e] border-b border-white/5' : ''
    }`}>
      {/* Background Geométrico para Topbar no Kanban */}
      {isGestaoTarefas && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.4]" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66z' fill='none' stroke='%232d8c6f' stroke-width='1'/%3E%3Cpath d='M28 100L0 84V52l28-16 28 16v32L28 100z' fill='none' stroke='%232d8c6f' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: '56px 100px',
            backgroundPosition: 'center top'
          }}
        />
      )}

      <div className="topbar-left relative z-10 flex items-center gap-[10px]">
        <div className={`breadcrumb text-[12px] flex items-center gap-1.5 font-medium uppercase tracking-wider ${
          isDarkBg ? 'text-emerald-500/80' : 'text-[var(--text3)]'
        }`}>
          Éllos 
          <span className="breadcrumb-sep opacity-40">/</span> 
          <span className={`${
            isDarkBg ? 'text-white' : 'text-[var(--text1)]'
          } font-bold text-[13px]`}>{title}</span>
        </div>
      </div>

      <div className="topbar-right flex items-center gap-[10px]">
        {/* All action buttons removed by user request */}
      </div>
    </header>
  )
}
