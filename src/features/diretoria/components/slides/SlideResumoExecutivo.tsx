'use client'
import React from 'react'
import { TrendingUp, TrendingDown, Wallet, Users, AlertTriangle, ArrowUpRight } from 'lucide-react'
import CountUp from '../CountUp'
import type { ApresentacaoKpis } from '../../hooks/useApresentacaoData'
import { MESES } from '@/lib/utils/formatters'

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.5'/%3E%3Cpath d='M28 100L0 84V52l28-16 28 16v32L28 100z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.4'/%3E%3C/svg%3E")`

interface SlideResumoExecutivoProps {
  kpis: ApresentacaoKpis
  mesRef: number
  anoRef: number
}

function KpiCard({ label, value, prefix, suffix, decimals, icon: Icon, color, bgColor, iconColor, sublabel }:
  { label: string; value: number; prefix?: string; suffix?: string; decimals?: number; icon: any; color: string; bgColor: string; iconColor: string; sublabel?: string }) {
  return (
    <div className={`relative flex flex-col gap-4 p-6 rounded-[24px] ${bgColor} border ${color} overflow-hidden group hover:brightness-110 transition-all duration-300`}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10`}>
          <Icon size={18} className={iconColor} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <p className={`text-[13px] font-black uppercase tracking-[2px] opacity-70 ${iconColor}`}>{label}</p>
        <div className="text-5xl md:text-6xl font-black text-white tracking-tight leading-none mt-2 mb-1">
          <CountUp value={value} prefix={prefix} suffix={suffix} decimals={decimals} duration={900} />
        </div>
        {sublabel && <p className="text-sm text-white/50 font-semibold mt-1">{sublabel}</p>}
      </div>
    </div>
  )
}

export default function SlideResumoExecutivo({ kpis, mesRef, anoRef }: SlideResumoExecutivoProps) {
  const isPositivo = kpis.resultadoMes >= 0

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-[#040d0a] p-10">
      {/* Background */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: HEX_PATTERN, backgroundSize: '56px 100px' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/3 via-transparent to-transparent" />

      <div className="relative z-10 flex flex-col h-full gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-black uppercase tracking-[3px] text-emerald-400/70">Resumo Executivo</p>
          <h2 className="text-5xl font-black text-white tracking-tight">Saúde da Associação</h2>
          <p className="text-base text-white/50 font-semibold">{MESES[mesRef]} / {anoRef} — Visão consolidada</p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          <KpiCard
            label="Saldo em Caixa"
            value={kpis.saldoCaixa}
            prefix="R$ "
            decimals={2}
            icon={Wallet}
            bgColor="bg-emerald-900/50"
            color="border-emerald-500/40"
            iconColor="text-emerald-300"
            sublabel="Posição consolidada"
          />
          <KpiCard
            label="Receita no Mês"
            value={kpis.receitaMes}
            prefix="R$ "
            decimals={2}
            icon={TrendingUp}
            bgColor="bg-teal-900/50"
            color="border-teal-500/40"
            iconColor="text-teal-300"
            sublabel="Valores efetivados"
          />
          <KpiCard
            label="Taxa de Inadimplência"
            value={kpis.inadimplenciaRate}
            suffix="%"
            decimals={1}
            icon={AlertTriangle}
            bgColor={kpis.inadimplenciaRate > 15 ? 'bg-rose-900/50' : 'bg-lime-900/50'}
            color={kpis.inadimplenciaRate > 15 ? 'border-rose-500/50' : 'border-lime-500/40'}
            iconColor={kpis.inadimplenciaRate > 15 ? 'text-rose-300' : 'text-lime-300'}
            sublabel={`R$ ${kpis.inadimplenciaValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em aberto`}
          />
          <KpiCard
            label="Associados Ativos"
            value={kpis.totalAtivos}
            icon={Users}
            bgColor="bg-cyan-900/50"
            color="border-cyan-500/40"
            iconColor="text-cyan-300"
            sublabel={`+${kpis.novasAdesoesCount} no período`}
          />
        </div>

        {/* Resultado destaque */}
        <div className={`flex items-center justify-between p-6 rounded-[20px] border ${isPositivo ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
          <div>
            <p className="text-[13px] font-black uppercase tracking-[2px] text-white/50">Resultado do Período</p>
            <div className={`text-4xl font-black tracking-tight mt-2 ${isPositivo ? 'text-emerald-400' : 'text-rose-400'}`}>
              <CountUp value={kpis.resultadoMes} prefix="R$ " decimals={2} duration={900} />
            </div>
          </div>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isPositivo ? 'bg-emerald-500/15 border border-emerald-500/20' : 'bg-rose-500/15 border border-rose-500/20'}`}>
            {isPositivo ? <TrendingUp size={28} className="text-emerald-400" /> : <TrendingDown size={28} className="text-rose-400" />}
          </div>
        </div>
      </div>
    </div>
  )
}
