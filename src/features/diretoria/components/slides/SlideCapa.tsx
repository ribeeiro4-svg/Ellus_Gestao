'use client'
import React from 'react'
import Image from 'next/image'
import { MESES } from '@/lib/utils/formatters'

interface SlideCapeProps {
  tenantNome: string
  tenantLogo: string
  mesRef: number
  anoRef: number
}

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.5'/%3E%3Cpath d='M28 100L0 84V52l28-16 28 16v32L28 100z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.4'/%3E%3C/svg%3E")`

export default function SlideCapa({ tenantNome, tenantLogo, mesRef, anoRef }: SlideCapeProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-[#040d0a]">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: HEX_PATTERN, backgroundSize: '56px 100px' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-[#040d0a]" />
      <div className="absolute inset-0 bg-gradient-radial-center from-emerald-900/20 to-transparent" style={{ background: 'radial-gradient(ellipse at center, rgba(5,46,22,0.4) 0%, transparent 70%)' }} />

      {/* Decorative rings */}
      <div className="absolute w-[600px] h-[600px] rounded-full border border-emerald-500/5 animate-pulse" />
      <div className="absolute w-[800px] h-[800px] rounded-full border border-emerald-500/3" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 text-center px-16">
        {/* Logo */}
        <div className="w-20 h-20 rounded-[24px] bg-[#0e2d22] border border-white/10 shadow-2xl shadow-emerald-900/50 flex items-center justify-center overflow-hidden">
          <img src={tenantLogo} alt="Logo" className="w-14 h-14 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = '/ellus_logo_dark.svg' }} />
        </div>

        {/* Tag */}
        <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[13px] font-black text-emerald-400 uppercase tracking-[3px]">Reunião de Diretoria</span>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-4">
          <h1 className="text-7xl md:text-8xl font-black text-white tracking-tight leading-none">
            Relatório
            <br />
            <span className="text-emerald-400">Gerencial</span>
          </h1>
          <p className="text-2xl font-bold text-white/50 uppercase tracking-[4px] mt-2">
            {MESES[mesRef]} / {anoRef}
          </p>
        </div>

        {/* Organization name */}
        <div className="mt-4">
          <p className="text-lg font-black text-white/70 uppercase tracking-[3px]">{tenantNome}</p>
        </div>

        {/* Bottom instruction */}
        <div className="mt-12 flex items-center gap-4 text-white/30">
          <div className="w-12 h-px bg-white/20" />
          <span className="text-[11px] font-bold uppercase tracking-widest">Use as setas ou clique para navegar</span>
          <div className="w-12 h-px bg-white/20" />
        </div>
      </div>
    </div>
  )
}
