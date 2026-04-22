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
  Lock,
  FileText,
  BookOpen,
  ChevronLeft,
  Menu
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
    section: 'Entidades', 
    items: [
      { href: '/associados', icon: Users, label: 'Gestão Geral' },
    ]
  },
  { 
    section: 'Gerencial', 
    items: [
      { href: '/estrategia', icon: Target, label: 'Estratégia' },
    ]
  },
  { 
    section: 'Recrutamento', 
    items: [
      { href: '/recrutamento', icon: BarChart3, label: 'Recrutamento' },
    ]
  },
  { 
    section: 'Fiscal & Contábil', 
    items: [
      { href: '/fiscal', icon: FileText, label: 'Escrituração Fiscal' },
      { href: '/contabil', icon: BookOpen, label: 'Contabilidade' },
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
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLogo = localStorage.getItem('acprobec_custom_logo')
      const savedName = localStorage.getItem('acprobec_user_name')
      const savedCollapse = localStorage.getItem('acprobec_sidebar_collapsed')
      if (savedLogo) setCustomLogo(savedLogo)
      if (savedName) setCustomName(savedName)
      if (savedCollapse === 'true') setIsCollapsed(true)
    }
  }, [])

  const toggleCollapse = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    localStorage.setItem('acprobec_sidebar_collapsed', String(next))
  }

  const logout = async () => {
    await sb.auth.signOut()
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path

  return (
    <div className="relative z-[60]">
      <button 
        onClick={toggleCollapse}
        className="absolute -right-3 top-10 w-6 h-6 bg-[#2d8c6f] text-white rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-white/20 z-[70] hover:scale-110 transition-transform cursor-pointer"
        title={isCollapsed ? 'Expandir' : 'Recolher'}
      >
        {isCollapsed ? <Menu size={12} /> : <ChevronLeft size={12} />}
      </button>

      <aside className={`sidebar h-screen sticky top-0 left-0 z-50 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[70px]' : 'w-[260px]'}`}>
        <div className={`sidebar-logo border-b border-white/5 relative flex flex-col transition-all duration-300 ${isCollapsed ? 'p-4 items-center' : 'p-6 items-center text-center'}`}>
          <div className={`logo-badge flex transition-all ${isCollapsed ? 'flex-row justify-center' : 'flex-col items-center gap-2 mb-2'}`}>
            <div className="logo-icon w-10 h-10 rounded-xl flex items-center justify-center text-white text-[18px] font-bold bg-gradient-to-br from-[#2d8c6f] to-[#34d399] overflow-hidden shrink-0 shadow-lg">
              {customLogo ? (
                <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                'AC'
              )}
            </div>
            {!isCollapsed && <div className="logo-title text-[17px] font-extrabold text-white tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-300">ACPROBEC</div>}
          </div>
          {!isCollapsed && <div className="logo-sub text-[10px] text-white/40 tracking-[1.2px] font-bold uppercase animate-in fade-in slide-in-from-bottom-2 duration-300">GESTÃO INTELIGENTE</div>}
          {!isCollapsed && (
            <div className="logo-divider w-full flex items-center gap-2 mt-4 text-[9px] text-white/15 tracking-[1.5px] font-black after:flex-1 after:h-[1px] after:bg-white/5 before:flex-1 before:h-[1px] before:bg-white/5 animate-in fade-in duration-500">
              INOVACONT
            </div>
          )}
        </div>

      <nav className="flex-1 py-4 overflow-y-auto scrollbar-none">
        {MENU.map(({ section, items }) => (
          <div key={section} className={`sidebar-section py-2 transition-all ${isCollapsed ? 'px-0' : ''}`}>
            {!isCollapsed && (
              <div className="sidebar-label text-[9.5px] font-bold text-white/20 tracking-[1.4px] uppercase px-5 pb-2 animate-in fade-in duration-300">
                {section}
              </div>
            )}
            <div className="space-y-0.5">
              {items.map(({ href, icon: Icon, label }) => {
                const active = isActive(href)
                const IconComponent = Icon as any
                return (
                  <div
                    key={href}
                    onClick={() => router.push(href)}
                    title={isCollapsed ? label : ''}
                    className={`nav-item flex items-center gap-[10px] py-2.5 cursor-pointer transition-all text-[12.5px] relative 
                      ${isCollapsed ? 'px-0 justify-center' : 'px-5'}
                      ${active ? 'active' : 'text-white/45 hover:text-white/90 hover:bg-white/5'}`}
                  >
                    <div className={`nav-icon w-7 h-7 rounded-lg flex items-center justify-center text-[13px] bg-white/5 transition-all ${isCollapsed ? 'w-10 h-10' : ''}`}>
                      <IconComponent size={isCollapsed ? 18 : 14} />
                    </div>
                    {!isCollapsed && <span className="font-medium animate-in fade-in slide-in-from-left-2 duration-300">{label}</span>}
                    {active && !isCollapsed && <div className="absolute inset-[0_8px] rounded-lg -z-10 bg-white/10" />}
                    {active && isCollapsed && <div className="absolute inset-[4px_8px] rounded-lg -z-10 bg-white/10" />}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={`sidebar-footer mt-auto border-t border-white/5 relative z-10 flex flex-col gap-4 transition-all ${isCollapsed ? 'p-3 items-center' : 'p-5'}`}>
        <div className={`flex items-center gap-3 transition-all ${isCollapsed ? 'flex-col gap-4' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 overflow-hidden shrink-0">
             {customLogo ? (
               <img src={customLogo} alt="Logo" className="w-full h-full object-cover opacity-60" />
             ) : (
               <Users size={16} />
             )}
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
               <p className="text-[11px] font-bold text-white/80 truncate">{customName}</p>
               <p className="text-[9px] text-white/20 uppercase tracking-tighter">Administrador</p>
            </div>
          )}
          <div className={`flex items-center gap-2 ${isCollapsed ? 'flex-col' : ''}`}>
            <button onClick={() => router.push('/configuracoes')} className="p-1 text-white/20 hover:text-white transition-colors" title="Configurações">
              <Settings size={16} />
            </button>
            <button onClick={logout} className="p-1 text-white/20 hover:text-red-400 transition-colors" title="Sair">
              <LogOut size={16} />
            </button>
          </div>
        </div>
        {!isCollapsed && (
          <div className="animate-in fade-in duration-500">
             <p className="text-[10px] text-white/25 font-medium">© 2024 ACPROBEC</p>
             <p className="text-[8px] text-white/10 mt-0.5">ESTRUTURA SaaS PROFISSIONAL</p>
          </div>
        )}
      </div>
    </aside>
  </div>
  )
}
