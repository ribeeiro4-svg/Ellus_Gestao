import React from 'react'
import Link from 'next/link'
import { LayoutDashboard, ShieldCheck, Zap, LineChart, ChevronRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0a1a14]">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-40 scale-110 animate-pulse duration-[10000ms]"
        style={{ 
          backgroundImage: 'url("/landing_hero_bg_1776648401526.png")', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          filter: 'blur(4px)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1a14]/60 via-transparent to-[#0a1a14] z-10" />

      {/* Hero Content */}
      <main className="relative z-20 flex flex-col items-center text-center px-6 max-w-5xl">
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            <Zap size={12} className="fill-current" /> Ecossistema Inovacont de Gestão
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-6 leading-tight">
            Portal <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">ACPROBEC</span>
          </h1>
          
          <p className="text-lg md:text-xl text-emerald-100/60 font-medium max-w-2xl mx-auto leading-relaxed mb-12">
            Inteligência financeira de ponta para associações. Controle completo de mensalidades, audit de recebíveis e fluxo de caixa em tempo real.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link 
              href="/resumo" 
              className="group relative px-10 py-5 bg-emerald-500 text-white rounded-[24px] font-black text-sm tracking-widest uppercase hover:bg-emerald-400 transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <LayoutDashboard size={20} />
              Acessar Dashboard
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Feature Grid (Glassmorphism) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <LineChart size={24} />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Análise Preditiva</h3>
            <p className="text-emerald-100/40 text-sm leading-relaxed">Projeções de caixa e superávit baseadas em inteligência histórica.</p>
          </div>

          <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Auditoria OFX</h3>
            <p className="text-emerald-100/40 text-sm leading-relaxed">Conciliação automática de extratos com cruzamento de dados de associados.</p>
          </div>

          <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <Zap size={24} />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Ações em Massa</h3>
            <p className="text-emerald-100/40 text-sm leading-relaxed">Gerenciamento dinâmico de mensalidades e lançamentos em lote.</p>
          </div>
        </div>
      </main>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <footer className="relative z-20 mt-20 py-8 opacity-30">
        <p className="text-white text-[10px] font-black uppercase tracking-[0.4em]">© 2024 INOVACONT · ACPROBEC · Inteligência em Benefícios</p>
      </footer>
    </div>
  )
}
