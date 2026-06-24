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
  ClipboardList,
  BookMarked
} from 'lucide-react'

const MENU = [
  { 
    section: 'Principal', 
    items: [
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
      { href: '/pop', icon: BookMarked, label: 'Manual de Procedimentos' },
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

    if (href === '/configuracoes' || href === '/pop') return true // Sempre visível para a aba Minha Conta e Manuais

    const moduloName = routeToModuleMap[href]
    if (moduloName) {
      return permissoes[moduloName]?.ver === true
    }

    // Se não tiver módulo mapeado, permite acesso por padrão ou 
    // podemos considerar que 'estrategia', 'recrutamento' são módulos que não implementamos o mapeamento, então deixamos visível.
    return true
  }

  const customLogo = (tenant?.logo_url && tenant.logo_url.startsWith('http')) ? tenant.logo_url : '/ellos_logo_dark.svg'
  const customName = tenant?.nome || 'Éllos'

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
          <div className={`logo-badge flex transition-all ${isCollapsed ? 'flex-row justify-center' : 'flex-col items-center gap-4 mb-4'}`}>
            <div className={`${isCollapsed ? 'w-10 h-10' : 'w-28 h-28'} rounded-[24px] bg-[#0A2618] border border-emerald-900/30 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-xl transition-all duration-500`}>
              <img src="/ellos_logo_dark.svg" alt="Éllos" className={`w-full h-full object-contain ${isCollapsed ? 'scale-125' : 'scale-[1.8]'}`} />
            </div>
          </div>
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
                )})}
            </div>
          </div>
        )})}
      </nav>

      <div className={`sidebar-footer mt-auto border-t border-white/5 relative z-10 flex flex-col gap-4 transition-all ${isCollapsed ? 'p-4 items-center' : 'p-8'}`}>
        <div className={`flex items-center gap-3 transition-all ${isCollapsed ? 'flex-col gap-4' : ''}`}>
          <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-white/40 overflow-hidden shrink-0 shadow-lg">
             {tenant?.logo_url && tenant.logo_url.startsWith('http') ? (
               <img src={tenant.logo_url} alt="Logo" className="w-full h-full object-cover" />
             ) : (
               <Users size={24} />
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
          <div className="w-full flex flex-col items-center mt-2 animate-in fade-in duration-500">
            <div className="text-[10px] text-white/50 tracking-[2px] font-bold uppercase mb-4">Versão 2.0</div>
            <div className="w-full h-[1px] bg-white/5 mb-3"></div>
            <p className="text-[8px] text-white/30 tracking-[1px] font-bold uppercase text-center leading-[1.4]">
              Desenvolvido por<br/>
              <span className="text-white/50">Áurea Inteligência Empresarial</span>
            </p>
            <div className="w-full h-[1px] bg-white/5 mt-3"></div>
          </div>
        )}
      </div>
    </aside>
  </div>
  )
}
