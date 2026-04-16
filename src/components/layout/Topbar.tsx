'use client'
import { usePathname, useRouter } from 'next/navigation'
import { Download, FileText, Printer, Bell, Search, User } from 'lucide-react'

const TITLES: Record<string, string> = {
  '/':              'Dashboard Geral',
  '/financeiro':    'Gestão Financeira',
  '/receitas':      'Controle de Receitas',
  '/despesas':      'Gestão de Despesas',
  '/associados':    'Base de Associados',
  '/inadimplencia': 'Relatório de Inadimplência',
  '/metas':         'Metas e Objetivos',
  '/projetos':      'Gestão de Projetos',
  '/evolucao':      'Evolução Mensal',
  '/importar':      'Importação de Dados',
}

export default function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const title = TITLES[pathname] || 'Dashboard'

  return (
    <header className="h-20 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          <span>ACPROBEC</span>
          <span className="text-slate-300">/</span>
          <span className="text-blue-600">{title}</span>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mt-1 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 gap-2 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            className="bg-transparent border-none outline-none text-sm text-slate-600 placeholder:text-slate-400 w-48"
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          
          <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 pr-4 rounded-full border border-slate-200">
               <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <User size={16} />
               </div>
               <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 leading-tight">Admin</span>
                  <span className="text-[10px] text-slate-500 leading-tight">Tesouraria</span>
               </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => router.push('/importar')}
                className="flex items-center gap-2 bg-white text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm active:scale-95"
              >
                <Download size={14} className="text-slate-500" />
                <span>Importar</span>
              </button>
              
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <FileText size={14} />
                <span>Relatório PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
