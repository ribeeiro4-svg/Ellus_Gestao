'use client'
import React, { useEffect, useState } from 'react'
import { X, Table } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
  ChartData,
  ChartOptions
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface Insight {
  label: string
  value: string | number
  sub?: string
  color?: string
}

interface ChartModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  chartType: 'bar' | 'line' | 'doughnut'
  chartData: ChartData<any>
  chartOptions?: ChartOptions<any>
  insights?: Insight[]
  tableData?: {
    headers: string[]
    rows: (string | number | React.ReactNode)[][]
  }
}

export default function ChartModal({
  isOpen,
  onClose,
  title,
  subtitle,
  chartType,
  chartData,
  chartOptions,
  insights,
  tableData
}: ChartModalProps) {
  // Use a local state that only tracks if the modal is physically in the DOM 
  // to allow for exit animations if needed, otherwise just use isOpen
  const [shouldRender, setShouldRender] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!shouldRender) return null

  const renderChart = () => {
    const options = {
      ...chartOptions,
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        ...chartOptions?.plugins,
        legend: {
          display: chartType === 'doughnut' || chartOptions?.plugins?.legend?.display,
          position: 'bottom' as const,
          labels: {
            color: 'rgba(255,255,255,0.7)',
            font: { size: 11 },
            boxWidth: 12,
            padding: 16
          }
        }
      },
      scales: chartType === 'doughnut' ? {} : {
        y: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } }
        },
        x: {
          grid: { display: false },
          ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } }
        }
      }
    }

    if (chartType === 'bar') return <Bar data={chartData} options={options} />
    if (chartType === 'line') return <Line data={chartData} options={options} />
    if (chartType === 'doughnut') return <Doughnut data={chartData} options={options} />
    return null
  }

  return (
    <div 
      className={`fixed inset-0 z-[500] flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ 
        backgroundColor: 'rgba(4, 14, 10, 0.82)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)'
      }}
      onClick={onClose}
    >
      <div 
        className={`chart-modal w-full max-w-[860px] max-height-[92vh] overflow-hidden bg-gradient-to-br from-[#0a2419] via-[#0e2d22] to-[#112b20] border border-[rgba(45,140,111,0.25)] rounded-2xl shadow-2xl transition-all duration-500 transform ${
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 pb-4 border-bottom border-[rgba(45,140,111,0.2)] sticky top-0 bg-[#0e2d22] z-10">
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            {subtitle && <p className="text-xs text-[rgba(255,255,255,0.45)] mt-1">{subtitle}</p>}
          </div>
          <button 
            onClick={onClose}
            className="p-2 transition-all rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(92vh-80px)]">
          {/* Chart View */}
          <div className="h-[320px] mb-8 relative">
            {renderChart()}
          </div>

          {/* Insights Grid */}
          {insights && insights.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {insights.map((ins, i) => (
                <div key={i} className="insight-card p-4 rounded-xl bg-white/5 border border-[rgba(45,140,111,0.2)] hover:border-[rgba(45,140,111,0.45)] hover:bg-white/10 transition-all">
                  <div className="text-[10px] font-bold text-[rgba(255,255,255,0.4)] uppercase tracking-widest mb-2">{ins.label}</div>
                  <div className="text-[20px] font-bold text-white tracking-tight" style={{ color: ins.color }}>{ins.value}</div>
                  {ins.sub && <div className="text-[10.5px] text-[rgba(255,255,255,0.4)] mt-1">{ins.sub}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Table Data */}
          {tableData && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-4 text-white/60">
                <Table size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Dados Detalhados</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[rgba(45,140,111,0.2)]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-[rgba(45,140,111,0.2)]">
                      {tableData.headers.map((h, i) => (
                        <th key={i} className="px-4 py-3 font-bold text-[rgba(255,255,255,0.45)] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tableData.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        {row.map((cell, j) => (
                          <td key={j} className="px-4 py-3 text-white/75">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
