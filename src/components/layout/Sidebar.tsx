'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/lib/hooks/useTenant'
import LogoV2 from '@/components/ui/LogoV2'
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
  ChevronDown,
  ChevronUp,
  Menu,
  ClipboardList,
  BookMarked
} from 'lucide-react'

const MENU = [
  { 
    section: 'Início', 
    items: [
      { href: '/resumo', icon: BarChart3, label: 'Visão Geral' },
    ]
  },
  { 
    section: 'Gente & Atendimentos', 
    items: [
      { href: '/associados', icon: Users, label: 'Cadastro de Vidas' },
      { href: '/atendimentos', icon: Calendar, label: 'Agenda & Atendimentos' },
      { href: '/recrutamento', icon: BarChart3, label: 'Recrutamento & Seleção' },
    ]
  },
  { 
    section: 'Financeiro', 
    items: [
      { href: '/financeiro', icon: Wallet, label: 'Gestão Financeira' },
      { href: '/planejamento', icon: Target, label: 'Planejamento Orçamentário' },
      { href: '/fechamento', icon: Lock, label: 'Fechamento Mensal' },
    ]
  },
  { 
    section: 'Gestão Estratégica', 
    items: [
      { href: '/estrategia', icon: Target, label: 'Metas & Projetos' },
      { href: '/gestao-tarefas', icon: ClipboardList, label: 'Painel de Tarefas' },
      { href: '/bens-duraveis', icon: Briefcase, label: 'Gestão de Ativos' },
      { href: '/pop', icon: BookMarked, label: 'Manuais de Processos' },
    ]
  },
  { 
    section: 'Controladoria', 
    items: [
      { href: '/fiscal', icon: FileText, label: 'Rotinas Fiscais' },
      { href: '/contabil', icon: BookOpen, label: 'Contabilidade Geral' },
    ]
  },
]


export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const sb = createClient()
  const { tenant } = useTenant()
  
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [permissoes, setPermissoes] = useState<Record<string, any>>({})
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {}
    MENU.forEach(m => {
      initialState[m.section] = true
    })
    return initialState
  })

  const toggleSection = (section: string) => {
    if (isCollapsed) return
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const allExpanded = MENU.every(m => !collapsedSections[m.section])

  const toggleAllSections = () => {
    const newState: Record<string, boolean> = {}
    const targetState = allExpanded ? true : false
    MENU.forEach(m => {
      newState[m.section] = targetState
    })
    setCollapsedSections(newState)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCollapse = localStorage.getItem('acprobec_sidebar_collapsed')
      if (savedCollapse === 'true') setIsCollapsed(true)
      
      try {
        const profileRaw = localStorage.getItem('user_profile')
        const permsRaw = localStorage.getItem('user_permissions')
        if (profileRaw) {
          const profile = JSON.parse(profileRaw)
          if (profile.perfil_id === 1) setIsAdmin(true)
        }
        if (permsRaw) {
          setPermissoes(JSON.parse(permsRaw))
        }
      } catch (e) {}
    }
    
    // Mobile event listener
    const handleToggleMobile = () => setIsMobileOpen(prev => !prev)
    window.addEventListener('toggleMobileSidebar', handleToggleMobile)
    return () => window.removeEventListener('toggleMobileSidebar', handleToggleMobile)
  }, [])

  const canSee = (href: string) => {
    if (isAdmin) return true
    if (href === '/' || href === '/resumo') return true

    const routeToModuleMap: Record<string, string> = {
      '/associados': 'socios',
      '/financeiro': 'financeiro',
      '/fechamento': 'fechamento',
      '/planejamento': 'planejamento',
      '/bens-duraveis': 'bens_duraveis',
      '/cobranca': 'cobrancas',
      '/atendimentos': 'atendimentos',
      '/auditoria': 'auditoria',
      '/estrategia': 'estrategia',
      '/gestao-tarefas': 'gestao_tarefas',
      '/recrutamento': 'recrutamento',
      '/fiscal': 'fiscal',
      '/contabil': 'contabil',
      '/importar': 'importar',
    }

    if (href === '/configuracoes' || href === '/pop') return true // Sempre visível para a aba Minha Conta e Manuais

    const moduloName = routeToModuleMap[href]
    if (moduloName) {
      return permissoes[moduloName]?.ver === true
    }

    // Se não tiver módulo mapeado, permite acesso por padrão ou 
    // podemos considerar que 'estrategia', 'recrutamento' são módulos que não implementamos o mapeamento, então deixamos visível.
    return true
  }

  const customLogo = (tenant?.logo_url && tenant.logo_url.startsWith('http')) ? tenant.logo_url : '/ellus_logo_dark.svg'
  const customName = tenant?.nome || 'Éllus'

  useEffect(() => {
    if (tenant) {
      console.log('[Sidebar] Tenant Data:', {
        nome: tenant.nome,
        logo: tenant.logo_url,
        hasLogo: !!customLogo,
        id: tenant.id
      })
    }
  }, [tenant, customLogo])

  const toggleCollapse = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    localStorage.setItem('acprobec_sidebar_collapsed', String(next))
  }

  const logout = async () => {
    // Chama o endpoint para excluir o cookie HttpOnly (rbac_token)
    await fetch('/api/auth/logout', { method: 'POST' })
    // Limpa a sessão do Supabase
    await sb.auth.signOut()
    // Limpa o localStorage das permissões
    localStorage.removeItem('user_profile')
    localStorage.removeItem('user_permissions')
    localStorage.removeItem('rbac_token_raw')
    // Força recarga completa para o middleware limpar o estado do cookie
    window.location.href = '/login'
  }

  const isActive = (path: string) => pathname === path

  return (
    <div className="relative z-[60]">
      {/* Overlay for mobile */}
      <div 
        className={`sidebar-overlay md:hidden ${isMobileOpen ? 'mobile-open' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />

      <button 
        onClick={toggleCollapse}
        className="absolute -right-3 top-10 w-6 h-6 bg-[#2d8c6f] text-white rounded-full md:flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-white/20 z-[70] hover:scale-110 transition-transform cursor-pointer hidden"
        title={isCollapsed ? 'Expandir' : 'Recolher'}
      >
        {isCollapsed ? <Menu size={12} /> : <ChevronLeft size={12} />}
      </button>

      <aside className={`sidebar h-screen sticky top-0 left-0 z-50 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[70px]' : 'w-[260px]'} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className={`sidebar-logo border-b border-white/5 relative flex flex-col transition-all duration-300 ${isCollapsed ? 'p-4 items-center' : 'py-4 px-6 items-center text-center'}`}>
          <div className={`logo-badge flex transition-all w-full ${isCollapsed ? 'flex-row justify-center' : 'flex-col items-center mb-2'}`}>
            {customLogo.includes('ellus') ? (
              <div 
                onClick={() => router.push('/resumo')}
                className={`cursor-pointer hover:opacity-85 transition-opacity w-full flex items-center justify-center ${isCollapsed ? 'h-10 px-1' : 'h-16 px-2'}`}
              >
                <LogoV2 variant="white" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div 
                onClick={() => router.push('/resumo')}
                className={`${isCollapsed ? 'w-10 h-10' : 'w-20 h-20'} cursor-pointer hover:scale-105 rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-xl transition-all duration-500 border bg-white border-white/10`}
              >
                <img 
                  src={customLogo} 
                  alt={customName} 
                  className="w-full h-full object-contain p-1" 
                />
              </div>
            )}
          </div>
        </div>

      <nav className="flex-1 py-2 overflow-y-auto scrollbar-none">
        {!isCollapsed && (
          <div className="px-5 mb-4 mt-2 flex justify-center animate-in fade-in duration-300">
            <button
              onClick={toggleAllSections}
              className="text-[9px] text-emerald-400/50 hover:text-emerald-400 transition-colors uppercase tracking-widest font-bold cursor-pointer"
            >
              {allExpanded ? 'Recolher Todos' : 'Expandir Todos'}
            </button>
          </div>
        )}
        {MENU.map(({ section, items }) => {
          const visivelItems = items.filter(i => canSee(i.href))
          if (visivelItems.length === 0) return null

          return (
            <div key={section} className={`sidebar-section py-2 transition-all ${isCollapsed ? 'px-0' : ''}`}>
              {!isCollapsed && (
                <div 
                  onClick={() => toggleSection(section)}
                  className="sidebar-label text-[13px] font-bold text-white/50 tracking-[1.4px] uppercase px-5 pb-2 animate-in fade-in duration-300 flex items-center justify-between cursor-pointer hover:text-white transition-colors"
                >
                  <span>{section}</span>
                  {collapsedSections[section] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </div>
              )}
              {(!collapsedSections[section] || isCollapsed) && (
                <div className="space-y-0.5 animate-in slide-in-from-top-2 fade-in duration-200">
                  {visivelItems.map(({ href, icon: Icon, label }) => {
                const active = isActive(href)
                const IconComponent = Icon as any
                return (
                  <div
                    key={href}
                    onClick={() => {
                      router.push(href)
                      setIsMobileOpen(false)
                    }}
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
                )})}
                </div>
              )}
            </div>
          )})}
        </nav>

      <div className={`sidebar-footer mt-auto border-t border-white/5 relative z-10 flex flex-col gap-3 transition-all ${isCollapsed ? 'p-4 items-center' : 'py-4 px-6'}`}>
        <div className={`flex items-center gap-3 transition-all ${isCollapsed ? 'flex-col gap-4' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 overflow-hidden shrink-0 shadow-lg">
             {tenant?.logo_url && tenant.logo_url.startsWith('http') ? (
               <img src={tenant.logo_url} alt="Logo" className="w-full h-full object-cover" />
             ) : (
               <Users size={18} />
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
          <div className="w-full flex flex-col items-center mt-1 animate-in fade-in duration-500">
            <div className="text-[10px] text-white/50 tracking-[2px] font-bold uppercase mb-2">Versão 2.0</div>
            <div className="w-full h-[1px] bg-white/5 mb-2"></div>
            <p className="text-[8px] text-white/30 tracking-[1px] font-bold uppercase text-center leading-[1.4]">
              Desenvolvido por<br/>
              <span className="text-white/50">Áurea Inteligência Empresarial</span>
            </p>
            <div className="w-full h-[1px] bg-white/5 mt-2"></div>
          </div>
        )}
      </div>
    </aside>
  </div>
  )
}
