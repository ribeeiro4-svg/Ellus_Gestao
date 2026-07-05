'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Maximize2, Minimize2, ChevronLeft, ChevronRight, X, Monitor, RefreshCw, Download, Settings } from 'lucide-react'
import { MESES } from '@/lib/utils/formatters'
import { useApresentacaoData } from '../hooks/useApresentacaoData'
import { downloadHtmlApresentacao } from '../utils/exportHtmlApresentacao'
import SlideNav from './SlideNav'
import ExecutiveCockpit from './cockpit/ExecutiveCockpit'
import ExecutiveConfig from './cockpit/ExecutiveConfig'
import SlideCapa from './slides/SlideCapa'
import SlideDashboardSaude from './slides/SlideDashboardSaude'
import SlideTimeline from './slides/SlideTimeline'
import SlideDiagnostico from './slides/SlideDiagnostico'
import SlideReceitas from './slides/SlideReceitas'
import SlideDespesas from './slides/SlideDespesas'
import SlideWaterfall from './slides/SlideWaterfall'
import SlideFluxoCaixa from './slides/SlideFluxoCaixa'
import SlideInadimplencia from './slides/SlideInadimplencia'
import SlideAssociados from './slides/SlideAssociados'
import SlideRiscos from './slides/SlideRiscos'
import SlideOportunidades from './slides/SlideOportunidades'
import SlideIndicadores from './slides/SlideIndicadores'
import SlideProjecoes from './slides/SlideProjecoes'
import SlidePlanoAcao from './slides/SlidePlanoAcao'
import SlideMensagemFinal from './slides/SlideMensagemFinal'
import { useProjecao } from '@/lib/hooks/useProjecao'

const SLIDE_TITLES = [
  'Capa Estratégica',
  'Dashboard de Saúde Geral',
  'Executive Timeline',
  'Diagnóstico e Acontecimentos',
  'Receitas e Tendências',
  'Despesas e Ofensores',
  'Resultado Financeiro (Waterfall)',
  'Fluxo de Caixa e Forecast',
  'Análise de Inadimplência',
  'Performance de Associados',
  'Matriz de Riscos',
  'Matriz de Oportunidades',
  'Indicadores Estratégicos',
  'Cenários e Perspectivas',
  'Plano de Ação Executável',
  'Mensagem Final',
]

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.5'/%3E%3Cpath d='M28 100L0 84V52l28-16 28 16v32L28 100z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.4'/%3E%3C/svg%3E")`

export default function ApresentacaoDiretoria() {
  const now = new Date()
  const [mesRef, setMesRef] = useState(now.getMonth())
  const [anoRef, setAnoRef] = useState(now.getFullYear())
  const [isConfiguring, setIsConfiguring] = useState(true)
  const [isCockpit, setIsCockpit] = useState(false)
  const [isEipConfig, setIsEipConfig] = useState(false)
  const [isPresenting, setIsPresenting] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null)
  const [slideKey, setSlideKey] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const data = useApresentacaoData(mesRef, anoRef)
  const { projecaoAnual } = useProjecao()

  const totalSlides = SLIDE_TITLES.length

  const goTo = useCallback((index: number, dir: 'next' | 'prev') => {
    if (index < 0 || index >= totalSlides) return
    setDirection(dir)
    setCurrentSlide(index)
    setSlideKey(k => k + 1)
  }, [totalSlides])

  const next = useCallback(() => goTo(currentSlide + 1, 'next'), [currentSlide, goTo])
  const prev = useCallback(() => goTo(currentSlide - 1, 'prev'), [currentSlide, goTo])

  // Keyboard navigation
  useEffect(() => {
    if (!isPresenting) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
      if (e.key === 'Escape') { setIsPresenting(false); setIsFullscreen(false); setIsConfiguring(true) }
      if (e.key === 'f' || e.key === 'F') toggleFullscreen()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isPresenting, next, prev])

  // Fullscreen change detection
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement && containerRef.current) {
      await containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const goToCockpit = () => {
    setIsConfiguring(false)
    setIsCockpit(true)
  }

  const startPresentation = () => {
    setIsCockpit(false)
    setIsEipConfig(false)
    setIsConfiguring(false)
    setIsPresenting(true)
    setCurrentSlide(0)
    setSlideKey(0)
  }

  const renderSlide = () => {
    switch (currentSlide) {
      case 0: return <SlideCapa tenantNome={data.tenantNome} tenantLogo={data.tenantLogo} mesRef={mesRef} anoRef={anoRef} />
      case 1: return <SlideDashboardSaude kpis={data.kpis} />
      case 2: return <SlideTimeline />
      case 3: return <SlideDiagnostico />
      case 4: return <SlideReceitas kpis={data.kpis} fluxo={data.fluxo6Meses} />
      case 5: return <SlideDespesas kpis={data.kpis} fluxo={data.fluxo6Meses} />
      case 6: return <SlideWaterfall />
      case 7: return <SlideFluxoCaixa fluxo={data.fluxo6Meses} />
      case 8: return <SlideInadimplencia kpis={data.kpis} />
      case 9: return <SlideAssociados kpis={data.kpis} evolucao={data.evolucaoAssociados} />
      case 10: return <SlideRiscos />
      case 11: return <SlideOportunidades />
      case 12: return <SlideIndicadores />
      case 13: return <SlideProjecoes projecaoAnual={projecaoAnual} mesRef={mesRef} />
      case 14: return <SlidePlanoAcao />
      case 15: return <SlideMensagemFinal />
      default: return null
    }
  }

  // ─── TELA DE CONFIGURAÇÃO DO EIE ──────────────────────────────────
  if (isEipConfig) {
    return <ExecutiveConfig onClose={() => setIsEipConfig(false)} />
  }

  // ─── TELA DO EXECUTIVE COCKPIT ────────────────────────────────────
  if (isCockpit) {
    return <ExecutiveCockpit onStartPresentation={startPresentation} />
  }

  // ─── TELA DE SELEÇÃO DE MÊS ─────────────────────────────────────────
  if (isConfiguring) {
    return (
      <div className="flex-1 w-full flex flex-col gap-3 min-h-[600px] animate-in fade-in duration-700">
        {/* Header */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between bg-gradient-to-br from-[#040d0a]/95 to-[#071a12]/95 backdrop-blur-2xl py-3.5 px-6 rounded-2xl border border-white/5 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#0e2d22] flex items-center justify-center text-emerald-400 shadow-lg">
              <Monitor size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Apresentar Resultados</h1>
              <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest">Modo Apresentação de Diretoria — {data.tenantNome}</p>
            </div>
          </div>
        </div>

        {/* Config Card */}
        <div className="relative flex-1 overflow-hidden bg-gradient-to-br from-[#040d0a]/95 to-[#071a12]/95 rounded-2xl border border-white/5 shadow-2xl flex flex-col items-center justify-center">
          <div className="absolute inset-0 opacity-15" style={{ backgroundImage: HEX_PATTERN, backgroundSize: '56px 100px' }} />
          <div className="absolute inset-0 bg-gradient-radial-center" style={{ background: 'radial-gradient(ellipse at center, rgba(5,46,22,0.3) 0%, transparent 70%)' }} />

          <div className="relative z-10 flex flex-col gap-8 p-10 items-center">
            {/* Illustration */}
            <div className="w-20 h-20 rounded-[24px] bg-[#0e2d22] border border-white/10 shadow-2xl flex items-center justify-center">
              <Monitor size={36} className="text-emerald-400" />
            </div>

            <div className="text-center">
              <h2 className="text-3xl font-black text-white tracking-tight">Configurar Apresentação</h2>
              <p className="text-white/40 font-semibold mt-2">Escolha o período de referência antes de iniciar</p>
            </div>

            {/* Period selector */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Mês</label>
                <select
                  value={mesRef}
                  onChange={e => setMesRef(Number(e.target.value))}
                  className="bg-white/5 border border-white/10 text-white font-bold text-sm rounded-xl px-4 py-3 focus:ring-1 focus:ring-emerald-500/40 outline-none"
                >
                  {MESES.map((m, i) => <option key={i} value={i} className="bg-[#0e2d22]">{m}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Ano</label>
                <select
                  value={anoRef}
                  onChange={e => setAnoRef(Number(e.target.value))}
                  className="bg-white/5 border border-white/10 text-white font-bold text-sm rounded-xl px-4 py-3 focus:ring-1 focus:ring-emerald-500/40 outline-none"
                >
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} className="bg-[#0e2d22]">{y}</option>)}
                </select>
              </div>
            </div>

            {/* Slides preview */}
            <div className="flex flex-wrap gap-2 justify-center max-w-xl">
              {SLIDE_TITLES.map((title, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <span className="text-[9px] font-black text-emerald-400">{i + 1}</span>
                  <span className="text-[10px] font-bold text-white/50">{title}</span>
                </div>
              ))}
            </div>

            {/* Loading indicator */}
            {data.loading && (
              <div className="flex items-center gap-2 text-white/30">
                <RefreshCw size={14} className="animate-spin" />
                <span className="text-[11px] font-bold uppercase tracking-widest">Carregando dados...</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Settings button */}
              <button
                onClick={() => setIsEipConfig(true)}
                disabled={data.loading}
                className="flex items-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-black text-sm rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                title="Configurar Metas e Pesos do EIE"
              >
                <Settings size={18} />
              </button>

              {/* Start button */}
              <button
                onClick={goToCockpit}
                disabled={data.loading}
                className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-emerald-900/40 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
              >
                <Monitor size={18} />
                {data.loading ? 'Carregando...' : `Acessar Cockpit — ${MESES[mesRef]} ${anoRef}`}
              </button>

              {/* Download HTML button */}
              <button
                onClick={() => downloadHtmlApresentacao(data)}
                disabled={data.loading}
                className="flex items-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 text-white/70 hover:text-white font-black text-sm rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                title="Baixar como arquivo HTML standalone — abre no navegador sem internet"
              >
                <Download size={18} />
                Baixar HTML
              </button>
            </div>

            <p className="text-[10px] text-white/20 font-bold">
              Pressione F para tela cheia · Setas para navegar · ESC para sair
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ─── MODO APRESENTAÇÃO ──────────────────────────────────────────────
  return (
    <div ref={containerRef} className="fixed inset-0 z-[200] bg-[#040d0a] group">
      {/* Cursor customizado */}
      <style>{`
        @keyframes slideInRight { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideInLeft  { from { transform: translateX(-60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeInSlide  { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .animate-slide-in-right { animation: slideInRight 280ms cubic-bezier(0.4,0,0.2,1) both; }
        .animate-slide-in-left  { animation: slideInLeft  280ms cubic-bezier(0.4,0,0.2,1) both; }
        .animate-fade-in        { animation: fadeInSlide  280ms cubic-bezier(0.4,0,0.2,1) both; }
      `}</style>

      {/* Controls bar — aparece no hover */}
      <div className="absolute top-6 right-6 z-[210] flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ cursor: 'auto' }}>
        <button
          onClick={toggleFullscreen}
          className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
          title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia (F)'}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
        <button
          onClick={() => { setIsPresenting(false); setIsConfiguring(true); if (isFullscreen) document.exitFullscreen() }}
          className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          title="Encerrar apresentação (ESC)"
        >
          <X size={14} />
        </button>
      </div>

      {/* Navigation */}
      <SlideNav
        current={currentSlide}
        total={totalSlides}
        onPrev={prev}
        onNext={next}
        slideTitle={SLIDE_TITLES[currentSlide]}
      />

      {/* Slide area */}
      <div className="w-full h-full relative overflow-hidden">
        <div
          key={slideKey}
          className={
            direction === 'next' ? 'animate-slide-in-right w-full h-full absolute inset-0' :
            direction === 'prev' ? 'animate-slide-in-left w-full h-full absolute inset-0' :
            'animate-fade-in w-full h-full absolute inset-0'
          }
        >
          {renderSlide()}
        </div>
      </div>

      {/* Click zones */}
      <div className="absolute inset-y-0 left-0 w-1/4 z-[199]" style={{ cursor: 'auto' }} onClick={prev} />
      <div className="absolute inset-y-0 right-0 w-1/4 z-[199]" style={{ cursor: 'auto' }} onClick={next} />
    </div>
  )
}
