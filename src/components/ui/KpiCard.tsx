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
  const categoryMap = {
    primary: { border: 'border-t-[#4f7ef8]', iconBg: 'bg-[#4f7ef8]/10', iconText: 'text-[#4f7ef8]' },
    success: { border: 'border-t-[#10b981]', iconBg: 'bg-[#10b981]/10', iconText: 'text-[#10b981]' },
    warning: { border: 'border-t-[#f59e0b]', iconBg: 'bg-[#f59e0b]/10', iconText: 'text-[#f59e0b]' },
    error:   { border: 'border-t-[#ef4444]', iconBg: 'bg-[#ef4444]/10', iconText: 'text-[#ef4444]' },
    info:    { border: 'border-t-[#0f1829]', iconBg: 'bg-[#0f1829]/10', iconText: 'text-[#0f1829]' },
    purple:  { border: 'border-t-[#8b5cf6]', iconBg: 'bg-[#8b5cf6]/10', iconText: 'text-[#8b5cf6]' },
  }

  const trendPositive = trend !== undefined && trend >= 0
  const style = categoryMap[category]

  return (
    <div className={`bg-white p-7 rounded-2xl shadow-sm border ${style.border} border-t-4 border-slate-100 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 group`}>
      <div className="flex items-start justify-between">
        <div className={`p-4 rounded-xl transition-all duration-500 group-hover:scale-110 ${style.iconBg} ${style.iconText}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg ${
            trendPositive ? 'text-[#10b981] bg-[#10b981]/10' : 'text-[#ef4444] bg-[#ef4444]/10'
          }`}>
            {trendPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      
      <div className="mt-8">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">{title}</p>
        <div className="flex items-baseline gap-2 mt-2.5">
          <h3 className="text-3xl font-bold text-[#0f1829] tracking-tight">{value}</h3>
          {trendLabel && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{trendLabel}</span>}
        </div>
      </div>
    </div>
  )
}
