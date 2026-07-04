'use client'
import React, { useEffect, useRef } from 'react'
import { Target } from 'lucide-react'
import type { Meta } from '@/lib/types'

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.5'/%3E%3Cpath d='M28 100L0 84V52l28-16 28 16v32L28 100z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.4'/%3E%3C/svg%3E")`

interface SlideMertasProps {
  metas: Meta[]
}

function AnimatedBar({ percentual }: { percentual: number }) {
  const barRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!barRef.current) return
    barRef.current.style.width = '0%'
    const t = setTimeout(() => {
      if (barRef.current) barRef.current.style.width = `${Math.min(percentual, 100)}%`
    }, 80)
    return () => clearTimeout(t)
  }, [percentual])

  const color = percentual >= 80 ? 'bg-emerald-500' : percentual >= 50 ? 'bg-amber-500' : 'bg-rose-500'
  return (
    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div ref={barRef} className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`} style={{ width: '0%' }} />
    </div>
  )
}

function StatusBadge({ percentual, prazo }: { percentual: number; prazo?: string }) {
  const today = new Date()
  const prazoDate = prazo ? new Date(prazo) : null
  const isOverdue = prazoDate && prazoDate < today && percentual < 100

  if (percentual >= 100) return <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">✓ Concluída</span>
  if (isOverdue) return <span className="text-[9px] font-black text-rose-400 bg-rose-500/15 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Atrasada</span>
  if (percentual >= 70) return <span className="text-[9px] font-black text-amber-400 bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Em Andamento</span>
  return <span className="text-[9px] font-black text-white/30 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Iniciada</span>
}

export default function SlideMetas({ metas }: SlideMertasProps) {
  const metasComPct = metas.map(m => ({
    ...m,
    pct: m.valor_meta > 0 ? Math.min((m.valor_realizado / m.valor_meta) * 100, 100) : 0
  }))

  const concluidas = metasComPct.filter(m => m.pct >= 100).length
  const emRisco = metasComPct.filter(m => {
    const prazoDate = m.prazo ? new Date(m.prazo) : null
    return prazoDate && prazoDate < new Date() && m.pct < 100
  }).length

  const metasExibir = metasComPct.slice(0, 7)

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-[#040d0a] p-10">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: HEX_PATTERN, backgroundSize: '56px 100px' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/3 via-transparent to-transparent" />

      <div className="relative z-10 flex flex-col h-full gap-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[3px] text-orange-400/70">Accountability</p>
            <h2 className="text-3xl font-black text-white tracking-tight">Metas e OKRs</h2>
            <p className="text-sm text-white/30 font-semibold mt-1">Progresso das iniciativas estratégicas</p>
          </div>
          <div className="flex gap-3">
            <div className="p-3 rounded-[16px] bg-white/5 border border-emerald-500/20 text-center min-w-[70px]">
              <p className="text-2xl font-black text-emerald-400">{concluidas}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Concluídas</p>
            </div>
            <div className="p-3 rounded-[16px] bg-white/5 border border-white/10 text-center min-w-[70px]">
              <p className="text-2xl font-black text-white">{metas.length}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Total</p>
            </div>
            {emRisco > 0 && (
              <div className="p-3 rounded-[16px] bg-white/5 border border-rose-500/20 text-center min-w-[70px]">
                <p className="text-2xl font-black text-rose-400">{emRisco}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Atrasadas</p>
              </div>
            )}
          </div>
        </div>

        {metas.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Target size={32} className="text-white/20" />
              <p className="text-white/30 font-bold">Nenhuma meta cadastrada</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 flex-1 overflow-hidden">
            {metasExibir.map((meta) => (
              <div key={meta.id} className="flex items-center gap-4 p-4 rounded-[18px] bg-white/5 border border-white/8 hover:bg-white/8 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-sm font-black text-white/80 truncate flex-1">{meta.meta}</p>
                    <StatusBadge percentual={meta.pct} prazo={meta.prazo} />
                  </div>
                  <div className="flex items-center gap-3">
                    <AnimatedBar percentual={meta.pct} />
                    <span className="text-[11px] font-black text-white/50 w-10 text-right shrink-0">{meta.pct.toFixed(0)}%</span>
                  </div>
                  {meta.prazo && (
                    <p className="text-[9px] text-white/20 font-semibold mt-1">Prazo: {new Date(meta.prazo).toLocaleDateString('pt-BR')} · {meta.responsavel}</p>
                  )}
                </div>
              </div>
            ))}
            {metas.length > 7 && (
              <p className="text-[10px] text-white/20 font-bold text-center">+{metas.length - 7} outras metas</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
