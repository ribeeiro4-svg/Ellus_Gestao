'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
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
  LogOut
} from 'lucide-react'

const MENU = [
  { 
    section: 'Principal', 
    items: [
      { href: '/', icon: BarChart3, label: 'Dashboard' },
    ]
  },
  { 
    section: 'Financeiro', 
    items: [
      { href: '/financeiro', icon: Wallet, label: 'Financeiro' },
      { href: '/receitas', icon: TrendingUp, label: 'Receitas' },
      { href: '/despesas', icon: TrendingDown, label: 'Despesas' },
    ]
  },
  { 
    section: 'Associados', 
    items: [
      { href: '/associados', icon: Users, label: 'Associados' },
      { href: '/inadimplencia', icon: AlertTriangle, label: 'Inadimplência' },
    ]
  },
  { 
    section: 'Gerencial', 
    items: [
      { href: '/metas', icon: Target, label: 'Metas' },
      { href: '/projetos', icon: Briefcase, label: 'Projetos' },
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
    ]
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const sb = createClient()

  const logout = async () => {
    await sb.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="flex flex-col w-[var(--sidebar-w)] h-screen fixed left-0 top-0 bg-[#0f1829] text-white border-r border-white/5 z-50">
      <div className="p-8 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#4f7ef8] flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
            A
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-white leading-none">ACPROBEC</div>
            <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">
              Dashboard SaaS
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-8 custom-scrollbar">
        {MENU.map(({ section, items }) => (
          <div key={section} className="space-y-1.5">
            <div className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-3">
              {section}
            </div>
            {items.map(({ href, icon: Icon, label }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-300 group relative ${
                    active 
                      ? 'bg-[#4f7ef8]/10 text-white font-semibold' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 w-1 h-6 bg-[#4f7ef8] rounded-r-full shadow-[0_0_15px_rgba(79,126,248,0.5)]"></div>
                  )}
                  <Icon 
                    size={20} 
                    className={active ? 'text-[#4f7ef8]' : 'text-slate-500 group-hover:text-slate-300 transition-colors'} 
                  />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      <div className="p-6">
        <div className="px-4 py-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500"></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">Gestão Áurea</p>
              <p className="text-[10px] text-slate-500 truncate">Administrador</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-[11px] font-bold text-[#ef4444] hover:text-red-300 transition-colors w-full px-1"
          >
            <LogOut size={14} />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
