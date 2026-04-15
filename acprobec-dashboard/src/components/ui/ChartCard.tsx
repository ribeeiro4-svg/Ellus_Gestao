'use client'
import { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  actions?: ReactNode
}

export default function ChartCard({ title, subtitle, children, actions }: ChartCardProps) {
  return (
    <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-base font-bold text-slate-900 tracking-tight">{title}</h4>
          {subtitle && <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      
      <div className="flex-1 min-h-[300px] w-full relative">
        {children}
      </div>
    </div>
  )
}
