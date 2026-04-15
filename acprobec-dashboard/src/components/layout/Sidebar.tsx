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
    <nav className="flex flex-col w-[var(--sidebar-w)] h-screen fixed left-0 top-0 bg-[#0f172a] text-white border-r border-white/10 z-50">
      <div className="p-6 mb-4">
        <div className="text-xl font-bold tracking-tight text-white">ACPROBEC</div>
        <div className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-1">
          Contabilidade · INOVACONT
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-6 custom-scrollbar">
        {MENU.map(({ section, items }) => (
          <div key={section} className="space-y-1">
            <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              {section}
            </div>
            {items.map(({ href, icon: Icon, label }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group ${
                    active 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} />
                  <span className="font-medium">{label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/10 bg-[#0f172a]/50">
        <div className="px-3 py-3 rounded-xl bg-white/5 flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold text-white">ACPROBEC</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Tesouraria Ativa</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-[11px] text-slate-400 hover:text-red-400 transition-colors w-full text-left"
          >
            <LogOut size={14} />
            <span>Sair do sistema</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
