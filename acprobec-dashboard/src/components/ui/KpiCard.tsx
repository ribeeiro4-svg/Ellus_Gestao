import { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  trend?: number
  trendLabel?: string
  icon: ReactNode
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'indigo'
}

export default function KpiCard({ title, value, trend, trendLabel, icon, color = 'blue' }: KpiCardProps) {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    red: 'text-red-600 bg-red-50 border-red-100',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  }

  const trendPositive = trend !== undefined && trend >= 0

  return (
    <div className="kpi-card group cursor-default">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-2xl border transition-all duration-300 group-hover:scale-110 ${colorMap[color]}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full ${
            trendPositive ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
          }`}>
            {trendPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <div className="flex items-baseline gap-2 mt-2">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
          {trendLabel && <span className="text-[10px] text-slate-400 font-medium">{trendLabel}</span>}
        </div>
      </div>
      
      <div className="mt-4 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
         <div className={`h-full rounded-full transition-all duration-1000 ${color.replace('text', 'bg')}`} style={{ width: '70%', background: 'currentColor' }}></div>
      </div>
    </div>
  )
}
