'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  AlertTriangle,
  Settings,
  MessageCircle,
  Megaphone
} from 'lucide-react'

const tabs = [
  { id: 'inadimplencia', label: 'Inadimplência', icon: AlertTriangle, href: '/cobrancas' },
  { id: 'regua', label: 'Régua de Cobrança', icon: Settings, href: '/cobrancas/regua' },
  { id: 'mensagens', label: 'Mensagens WhatsApp', icon: MessageCircle, href: '/cobrancas/mensagens' },
  { id: 'comunicados', label: 'Comunicados em Massa', icon: Megaphone, href: '/cobrancas/comunicados' },
]

export default function CobrancasLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const getActiveIcon = () => {
    const activeTab = tabs.find(t => 
      t.href === '/cobrancas' ? pathname === '/cobrancas' : pathname.startsWith(t.href)
    )
    if (activeTab) {
      const Icon = activeTab.icon
      return <Icon size={24} />
    }
    return <AlertTriangle size={24} />
  }

  return (
    <div className="flex flex-col flex-1 animate-in fade-in duration-500 pb-20 p-6 md:p-8">
      {/* Header Centralizado - Estilo Hub Premium */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white/40 backdrop-blur-md py-3.5 px-6 rounded-2xl border border-white/60 shadow-sm mb-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 transition-all duration-500">
            {getActiveIcon()}
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-tight">Módulo de Cobranças</h1>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest opacity-70 mt-1">Gestão de Inadimplência e Comunicação</p>
          </div>
        </div>

        {/* Custom Tab Switcher - Premium Interaction */}
        <div className="bg-slate-100/60 p-1.5 rounded-[22px] flex flex-wrap items-center gap-1 border border-slate-200/40 backdrop-blur-sm shadow-inner">
          {tabs.map((tab) => {
            const isActive = tab.href === '/cobrancas' ? pathname === '/cobrancas' : pathname.startsWith(tab.href)
            const Icon = tab.icon
            
            return (
              <Link
                href={tab.href}
                key={tab.id}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-wider transition-all duration-500
                  ${isActive 
                    ? 'bg-white text-amber-600 shadow-md border border-slate-200/50 scale-105' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}
                `}
              >
                <Icon size={14} />
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
