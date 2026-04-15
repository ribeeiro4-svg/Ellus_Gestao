'use client'
// ─── app/(dashboard)/layout.tsx ───────────────────────────────────────────
import Sidebar from '@/components/layout/Sidebar'
import Topbar  from '@/components/layout/Topbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: 'var(--sidebar-w)', flex: 1 }}>
        <Topbar />
        <main style={{ padding: '28px' }}>{children}</main>
      </div>
    </div>
  )
}

// ─── components/layout/Sidebar.tsx ────────────────────────────────────────
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const MENU = [
  { section: 'Principal', items: [
    { href: '/',              icon: '📊', label: 'Dashboard' },
  ]},
  { section: 'Financeiro', items: [
    { href: '/financeiro',    icon: '💰', label: 'Financeiro' },
    { href: '/receitas',      icon: '📈', label: 'Receitas' },
    { href: '/despesas',      icon: '📉', label: 'Despesas' },
  ]},
  { section: 'Associados', items: [
    { href: '/associados',    icon: '👥', label: 'Associados' },
    { href: '/inadimplencia', icon: '⚠️', label: 'Inadimplência' },
  ]},
  { section: 'Gerencial', items: [
    { href: '/metas',         icon: '🎯', label: 'Metas' },
    { href: '/projetos',      icon: '📋', label: 'Projetos' },
  ]},
  { section: 'Análise', items: [
    { href: '/evolucao',      icon: '📆', label: 'Evolução Mensal' },
  ]},
  { section: 'Dados', items: [
    { href: '/importar',      icon: '📥', label: 'Importar Dados' },
  ]},
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const sb       = createClient()

  const logout = async () => {
    await sb.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-title">ACPROBEC</div>
        <div className="logo-sub">Contabilidade · INOVACONT</div>
      </div>

      {MENU.map(({ section, items }) => (
        <div key={section} className="sidebar-section">
          <div className="sidebar-label">{section}</div>
          {items.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${pathname === href ? 'active' : ''}`}
            >
              <span className="icon">{icon}</span> {label}
            </Link>
          ))}
        </div>
      ))}

      <div className="sidebar-footer">
        <p>ACPROBEC · Tesouraria</p>
        <p style={{ marginTop: 3, fontSize: 10, color: 'rgba(255,255,255,.15)' }}>
          Contabilidade: INOVACONT
        </p>
        <button
          onClick={logout}
          style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,.3)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Sair →
        </button>
      </div>
    </nav>
  )
}

// ─── components/layout/Topbar.tsx ─────────────────────────────────────────
'use client'
import { usePathname, useRouter } from 'next/navigation'

const TITLES: Record<string, string> = {
  '/':              'Dashboard',
  '/financeiro':    'Financeiro',
  '/receitas':      'Receitas',
  '/despesas':      'Despesas',
  '/associados':    'Associados',
  '/inadimplencia': 'Inadimplência',
  '/metas':         'Metas',
  '/projetos':      'Projetos',
  '/evolucao':      'Evolução Mensal',
  '/importar':      'Importar Dados',
}

export default function Topbar() {
  const pathname = usePathname()
  const router   = useRouter()
  const title    = TITLES[pathname] || 'Dashboard'

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="breadcrumb">
          ACPROBEC › <span>{title}</span>
        </div>
      </div>
      <div className="topbar-right">
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>
          {new Date().getFullYear()}
        </span>
        <button className="btn btn-outline btn-sm" onClick={() => router.push('/importar')}>
          📥 Importar
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
          📄 Relatório PDF
        </button>
      </div>
    </div>
  )
}
