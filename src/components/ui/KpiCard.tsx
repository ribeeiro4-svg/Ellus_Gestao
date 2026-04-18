import React from 'react'

interface KpiCardProps {
  title: string
  value: string | number
  trend?: number
  trendLabel?: string
  subtitle?: React.ReactNode
  icon: React.ReactNode
  category?: 'success' | 'info' | 'error' | 'purple' | 'indigo' | 'danger'
}

export default function KpiCard({ 
  title, 
  value, 
  trend, 
  trendLabel, 
  subtitle,
  icon, 
  category = 'info' 
}: KpiCardProps) {
  
  const colors = {
    success: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20 text-emerald-600 bg-emerald-50',
    info: 'from-blue-500 to-blue-600 shadow-blue-500/20 text-blue-600 bg-blue-50',
    error: 'from-rose-500 to-rose-600 shadow-rose-500/20 text-rose-600 bg-rose-50',
    danger: 'from-rose-500 to-rose-600 shadow-rose-500/20 text-rose-600 bg-rose-50',
    indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/20 text-indigo-600 bg-indigo-50',
    purple: 'from-violet-500 to-violet-600 shadow-violet-500/20 text-violet-600 bg-violet-50'
  }

  const borderColors = {
    success: 'border-t-emerald-500',
    info: 'border-t-blue-500',
    error: 'border-t-rose-500',
    danger: 'border-t-rose-500',
    indigo: 'border-t-indigo-500',
    purple: 'border-t-violet-500'
  }

  return (
    <div className={`kpi-card bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden group border-t-4 ${borderColors[category]}`}>
      <div className="flex justify-between items-start relative z-10">
        <div className="flex-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[1.5px] mb-1.5">{title}</p>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h3>
          {subtitle && <div className="mt-1 leading-none">{subtitle}</div>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 flex-shrink-0 ${colors[category]}`}>
          {icon}
        </div>
      </div>
      
      {(trend !== undefined || trendLabel) && (
        <div className="flex items-center gap-2 mt-4 relative z-10">
          {trend !== undefined && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {trend >= 0 ? '↗' : '↘'} {Math.abs(trend)}%
            </span>
          )}
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{trendLabel}</span>
        </div>
      )}

      {/* Decorative inner glow */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity ${colors[category].split(' ')[0]}`} />
    </div>
  )
}
