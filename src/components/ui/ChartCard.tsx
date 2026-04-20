'use client'
import { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  actions?: ReactNode
  onClick?: () => void
}

export default function ChartCard({ title, subtitle, children, actions, onClick }: ChartCardProps) {
  return (
    <div className={`chart-card ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <div className="chart-header">
        <div>
          <div className="chart-title">{title}</div>
          {subtitle && <div className="chart-subtitle">{subtitle}</div>}
        </div>
        {actions && <div className="chart-actions flex items-center gap-2">{actions}</div>}
      </div>
      
      <div className="chart-wrap min-h-[320px] w-full relative">
        {children}
      </div>
    </div>
  )
}
