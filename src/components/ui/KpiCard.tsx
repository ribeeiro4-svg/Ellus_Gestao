import { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  trend?: number
  trendLabel?: string
  icon: ReactNode
  category?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'purple'
}

export default function KpiCard({ title, value, trend, trendLabel, icon, category = 'primary' }: KpiCardProps) {
  const categoryColors = {
    primary: 'var(--accent)',
    success: 'var(--green)',
    warning: 'var(--orange)',
    error:   'var(--red)',
    info:    'var(--navy)',
    purple:  'var(--purple)',
  }

  const trendPositive = trend !== undefined && trend >= 0
  const kpiColor = categoryColors[category]

  return (
    <div 
      className="kpi-card p-4.5 group"
      style={{ '--kpi-color': kpiColor } as any}
    >
      <div className="kpi-label flex items-center gap-1 text-[10.5px] font-bold text-[var(--text3)] uppercase tracking-[0.9px] mb-2">
        <span className="opacity-70 group-hover:scale-110 transition-transform duration-300">
           {icon}
        </span>
        {title}
      </div>
      
      <div className="kpi-value text-[26px] font-bold text-[var(--text1)] leading-none tracking-[-0.5px] mb-1">
        {value}
      </div>
      
      {trendLabel && (
        <div className="kpi-sub text-[11px] text-[var(--text3)] font-normal">
          {trendLabel}
        </div>
      )}

      {trend !== undefined && (
        <div className={`kpi-delta mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold 
          ${trendPositive ? 'up bg-[var(--green-light)] text-[var(--green-dark)]' : 'down bg-[var(--red-light)] text-[var(--red-dark)]'}`}
        >
          {trendPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
  )
}
