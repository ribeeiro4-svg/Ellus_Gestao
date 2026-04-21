'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Home,
  BarChart3, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle, 
  Target, 
  Briefcase, 
  Calendar, 
  Download,
  LogOut,
  Settings,
  Calculator,
  FileCheck,
  ShoppingCart,
  ShieldCheck,
  Lock
} from 'lucide-react'

const MENU = [
  { 
    section: 'Principal', 
    items: [
      { href: '/', icon: Home, label: 'Início (Site)' },
      { href: '/resumo', icon: BarChart3, label: 'Dashboard' },
    ]
  },
  { 
    section: 'Financeiro', 
    items: [
      { href: '/financeiro', icon: Wallet, label: 'Financeiro' },
      { href: '/planejamento', icon: Target, label: 'Planejamento' },
      { href: '/fechamento', icon: Lock, label: 'Fechamento Mensal' },
    ]
  },
  { 
    section: 'Associados', 
    items: [
      { href: '/associados', icon: Users, label: 'Associados' },
      { href: '/fornecedores', icon: ShoppingCart, label: 'Fornecedores' },
    ]
  },
  { 
    section: 'Gerencial', 
    items: [
      { href: '/metas', icon: Target, label: 'Metas' },
      { href: '/projetos', icon: Briefcase, label: 'Projetos' },
      { href: '/diretoria', icon: ShieldCheck, label: 'Diretoria' },
    ]
  },
  { 
    section: 'Recrutamento', 
    items: [
      { href: '/recrutamento', icon: BarChart3, label: 'Dashboard' },
      { href: '/recrutamento/vagas', icon: Briefcase, label: 'Gestão de Vagas' },
      { href: '/recrutamento/kanban', icon: FileCheck, label: 'Painel Kanban' },
      { href: '/recrutamento/talentos', icon: Users, label: 'Banco de Talentos' },
    ]
  },
  { 
    section: 'Análise', 
    items: [
      { href: '/evolucao', icon: Calendar, label: 'Evolução Mensal' },
    ]
  },
  { 
    section: 'Dados', 
    items: [
      { href: '/importar', icon: Download, label: 'Importar Dados' },
      { href: '/configuracoes', icon: Settings, label: 'Configurações' },
    ]
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const sb = createClient()
  
  const [customLogo, setCustomLogo] = useState<string | null>(null)
  const [customName, setCustomName] = useState('Gestão Áurea')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLogo = localStorage.getItem('acprobec_custom_logo')
      const savedName = localStorage.getItem('acprobec_user_name')
      if (savedLogo) setCustomLogo(savedLogo)
      if (savedName) setCustomName(savedName)
    }
  }, [])

  const logout = async () => {
    await sb.auth.signOut()
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path

  return (
    <aside className="sidebar w-[var(--sidebar-w)] h-screen sticky top-0 left-0 z-50 flex flex-col overflow-hidden overflow-y-auto scrollbar-none transition-transform duration-300">
      <div className="sidebar-logo p-[22px_22px_18px] border-b border-white/5 relative">
        <div className="logo-badge flex items-center gap-2 mb-1.5">
          <div className="logo-icon w-8 h-8 rounded-[9px] flex items-center justify-center text-white text-[15px] font-bold bg-gradient-to-br from-[#2d8c6f] to-[#34d399] overflow-hidden">
            {customLogo ? (
              <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              'AC'
            )}
          </div>
          <div className="logo-title text-[15px] font-bold text-white tracking-tight">ACPROBEC</div>
        </div>
        <div className="logo-sub text-[9.5px] text-white/35 mt-0.5 tracking-[0.8px] font-medium uppercase">GESTÃO INTELIGENTE</div>
        <div className="logo-divider flex items-center gap-2 mt-2.5 text-[9px] text-white/20 tracking-[0.6px] font-bold after:flex-1 after:h-[1px] after:bg-white/5 before:flex-1 before:h-[1px] before:bg-white/5">
          INOVACONT
        </div>
      </div>

      <nav className="flex-1 py-4">
        {MENU.map(({ section, items }) => (
          <div key={section} className="sidebar-section py-2">
            <div className="sidebar-label text-[9.5px] font-bold text-white/20 tracking-[1.4px] uppercase px-5 pb-2">
              {section}
            </div>
            <div className="space-y-0.5">
              {items.map(({ href, icon: Icon, label }) => {
                const active = isActive(href)
                const IconComponent = Icon as any
                return (
                  <div
                    key={href}
                    onClick={() => router.push(href)}
                    className={`nav-item flex items-center gap-[10px] px-5 py-2.5 cursor-pointer transition-all text-[12.5px] relative 
                      ${active ? 'active' : 'text-white/45 hover:text-white/90 hover:bg-white/5'}`}
                  >
                    <div className="nav-icon w-7 h-7 rounded-lg flex items-center justify-center text-[13px] bg-white/5 transition-all">
                      <IconComponent size={14} />
                    </div>
                    <span className="font-medium">{label}</span>
                    {active && <div className="absolute inset-[0_8px] rounded-lg -z-10 bg-white/10" />}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer mt-auto p-5 border-t border-white/5 relative z-10 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 overflow-hidden">
             {customLogo ? (
               <img src={customLogo} alt="Logo" className="w-full h-full object-cover opacity-60" />
             ) : (
               <Users size={16} />
             )}
          </div>
          <div className="flex-1 overflow-hidden">
             <p className="text-[11px] font-bold text-white/80 truncate">{customName}</p>
             <p className="text-[9px] text-white/20 uppercase tracking-tighter">Administrador</p>
          </div>
          <button onClick={() => router.push('/configuracoes')} className="text-white/20 hover:text-white transition-colors" title="Configurações">
            <Settings size={16} />
          </button>
          <button onClick={logout} className="text-white/20 hover:text-red-400 transition-colors" title="Sair">
            <LogOut size={16} />
          </button>
        </div>
        <div>
           <p className="text-[10px] text-white/25 font-medium">© 2024 ACPROBEC</p>
           <p className="text-[8px] text-white/10 mt-0.5">ESTRUTURA SaaS PROFISSIONAL</p>
        </div>
      </div>
    </aside>
  )
}
