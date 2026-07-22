'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Wallet, 
  CreditCard, 
  Users, 
  Activity, 
  Target, 
  ShieldCheck, 
  Lightbulb, 
  Flag, 
  PieChart,
  FileText
} from 'lucide-react'

const MODULES = [
  { id: 'financeiro', label: 'Financeiro', icon: Wallet, href: '/relatorios/financeiro' },
  { id: 'cobranca', label: 'Cobrança', icon: CreditCard, href: '/relatorios/cobranca' },
  { id: 'associados', label: 'Associados', icon: Users, href: '/relatorios/associados' },
  { id: 'operacional', label: 'Operacional', icon: Activity, href: '/relatorios/operacional' },
  { id: 'estrategico', label: 'Estratégico', icon: Target, href: '/relatorios/estrategico' },
  { id: 'governanca', label: 'Governança', icon: ShieldCheck, href: '/relatorios/governanca' },
  { id: 'inteligencia', label: 'Inteligência', icon: Lightbulb, href: '/relatorios/inteligencia' },
  { id: 'metas', label: 'Metas', icon: Flag, href: '/relatorios/metas' },
  { id: 'analitico', label: 'Analítico', icon: PieChart, href: '/relatorios/analitico' },
  { id: 'extratos', label: 'Extratos & Docs', icon: FileText, href: '/relatorios/extratos' },
]

export default function ReportsNavigation() {
  const pathname = usePathname()

  return (
    <div className="w-full overflow-x-auto border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
      <nav className="flex items-center p-2 min-w-max space-x-1">
        {MODULES.map((mod) => {
          const isActive = pathname.startsWith(mod.href)
          const Icon = mod.icon
          return (
            <Link 
              key={mod.id} 
              href={mod.href}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {mod.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
