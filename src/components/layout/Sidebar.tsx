'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTenant } from '@/lib/hooks/useTenant'
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
  Menu,
  ClipboardList
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
    section: 'Vidas', 
    items: [
      { href: '/associados', icon: Users, label: 'Gestão de Vidas' },
      { href: '/atendimentos', icon: Calendar, label: 'Atendimentos e Agendamentos' },
    ]
  },
  { 
    section: 'Gerencial', 
    items: [
      { href: '/estrategia', icon: Target, label: 'Metas e Projetos' },
      { href: '/gestao-tarefas', icon: ClipboardList, label: 'Gestão de Tarefas' },
      { href: '/bens-duraveis', icon: Briefcase, label: 'Bens Duráveis' },
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
  const { tenant } = useTenant()
  
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [permissoes, setPermissoes] = useState<Record<string, any>>({})
  const [isAdmin, setIsAdmin] = useState(false)

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

    if (href === '/configuracoes') return true // Sempre visível para a aba Minha Conta

    const moduloName = routeToModuleMap[href]
    if (moduloName) {
      return permissoes[moduloName]?.ver === true
    }

    // Se não tiver módulo mapeado, permite acesso por padrão ou 
    // podemos considerar que 'estrategia', 'recrutamento' são módulos que não implementamos o mapeamento, então deixamos visível.
    return true
  }

  const customLogo = (tenant?.logo_url && tenant.logo_url.startsWith('http')) ? tenant.logo_url : null
  const customName = tenant?.nome || 'ACPROBEC'

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
      <button 
        onClick={toggleCollapse}
        className="absolute -right-3 top-10 w-6 h-6 bg-[#2d8c6f] text-white rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-white/20 z-[70] hover:scale-110 transition-transform cursor-pointer"
        title={isCollapsed ? 'Expandir' : 'Recolher'}
      >
        {isCollapsed ? <Menu size={12} /> : <ChevronLeft size={12} />}
      </button>

      <aside className={`sidebar h-screen sticky top-0 left-0 z-50 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[70px]' : 'w-[260px]'}`}>
        <div className={`sidebar-logo border-b border-white/5 relative flex flex-col transition-all duration-300 ${isCollapsed ? 'p-4 items-center' : 'p-6 items-center text-center'}`}>
          <div className={`logo-badge flex transition-all ${isCollapsed ? 'flex-row justify-center' : 'flex-col items-center gap-5 mb-5'}`}>
            <div className={`logo-icon ${isCollapsed ? 'w-10 h-10' : 'w-24 h-24'} rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-2xl transition-all duration-500 ${customLogo ? 'bg-white' : 'bg-gradient-to-br from-[#2d8c6f] to-[#34d399]'}`}>
              {customLogo ? (
                <img src={customLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className={`text-white font-bold ${isCollapsed ? 'text-[16px]' : 'text-3xl'}`}>AC</span>
              )}
            </div>
            {!isCollapsed && <div className="logo-title text-[20px] font-black text-white tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-500">ACPROBEC</div>}
          </div>
          {!isCollapsed && <div className="logo-sub text-[11px] text-white/40 tracking-[1.5px] font-bold uppercase animate-in fade-in slide-in-from-bottom-2 duration-300">GESTÃO INTELIGENTE</div>}
          {!isCollapsed && (
            <div className="logo-divider w-full flex items-center gap-2 mt-6 text-[9px] text-white/15 tracking-[2px] font-black after:flex-1 after:h-[1px] after:bg-white/5 before:flex-1 before:h-[1px] before:bg-white/5 animate-in fade-in duration-500">
              ÁUREA Tech
            </div>
          )}
        </div>

      <nav className="flex-1 py-4 overflow-y-auto scrollbar-none">
        {MENU.map(({ section, items }) => {
          const visivelItems = items.filter(i => canSee(i.href))
          if (visivelItems.length === 0) return null

          return (
            <div key={section} className={`sidebar-section py-2 transition-all ${isCollapsed ? 'px-0' : ''}`}>
              {!isCollapsed && (
                <div className="sidebar-label text-[9.5px] font-bold text-white/20 tracking-[1.4px] uppercase px-5 pb-2 animate-in fade-in duration-300">
                  {section}
                </div>
              )}
              <div className="space-y-0.5">
                {visivelItems.map(({ href, icon: Icon, label }) => {
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
        )})}
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
