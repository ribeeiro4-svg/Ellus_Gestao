'use client'

import React, { useEffect, useState } from 'react'
import { X, Sparkles, ChevronRight, ChevronLeft, ClipboardList, DollarSign, UserSearch, ShieldCheck, Activity, CheckCircle2, BookMarked, Smartphone, Mail, BarChart2 } from 'lucide-react'
import Image from 'next/image'
import LogoV2 from '@/components/ui/LogoV2'

const TOUR_STEPS = [
  {
    title: 'A versão mais completa do sistema.',
    description: 'Mobilidade, processos documentados e cobranças automatizadas. A versão 2.0 fecha o ciclo da gestão inteligente.',
    icon: Sparkles,
    color: 'emerald'
  },
  {
    title: 'Sistema 100% responsivo no celular.',
    description: 'Acesse dashboards, tabelas, cards e módulos completos direto do seu smartphone. O sistema se adapta automaticamente a qualquer tela, sem perder nenhuma funcionalidade.',
    icon: Smartphone,
    color: 'blue'
  },
  {
    title: 'Manual de Procedimentos integrado.',
    description: '21 POPs documentados para os 13 módulos do sistema. Consulte o passo a passo de cada processo, filtre por área e exporte em PDF direto pelo sistema — sem sair do painel.',
    icon: BookMarked,
    color: 'indigo'
  },
  {
    title: 'Cobranças por e-mail com um clique.',
    description: 'Além do WhatsApp, agora você envia as notificações de cobrança direto por e-mail. O sistema gera o texto personalizado, monta o layout profissional e registra no histórico automaticamente.',
    icon: Mail,
    color: 'amber'
  },
  {
    title: 'Melhorias nos Relatórios e Filtros.',
    description: 'Os gráficos de disparos agora estão mais legíveis e ganharam o filtro "Hoje". Além disso, seus filtros de segmentação de associados agora ficam salvos mesmo ao sair da tela!',
    icon: BarChart2,
    color: 'violet'
  },
  {
    title: 'Organize o trabalho da equipe sem sair do sistema.',
    description: 'Crie tarefas, defina responsáveis e acompanhe o andamento em tempo real com um quadro Kanban integrado. Do pendente ao concluído, tudo em um só lugar.',
    icon: ClipboardList,
    color: 'cyan'
  },
  {
    title: 'Cada pessoa vê só o que precisa ver.',
    description: 'Defina permissões por perfil de acesso e garanta que cada colaborador opere apenas dentro da sua área. Segurança e controle sem complicar o dia a dia.',
    icon: ShieldCheck,
    color: 'rose'
  },
  {
    title: 'Pronto para começar?',
    description: 'O sistema está completo e à sua disposição. Explore os novos módulos e sinta a diferença no seu dia a dia.',
    icon: CheckCircle2,
    color: 'emerald'
  }
]

import GeometricBackground from '@/components/ui/GeometricBackground'

export default function ReleaseNotesModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showAnimation, setShowAnimation] = useState(false)

  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    const hideForever = localStorage.getItem('release_notes_v6_hide_forever')
    const seenSession = sessionStorage.getItem('release_notes_v6_seen_session')
    
    if (!seenSession) {
      if (!hideForever) {
        const timer = setTimeout(() => setIsOpen(true), 1200)
        return () => clearTimeout(timer)
      } else {
        setShowAnimation(true)
        sessionStorage.setItem('release_notes_v6_seen_session', 'true')
        setTimeout(() => setShowAnimation(false), 2000)
      }
    }
  }, [])

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('release_notes_v6_hide_forever', 'true')
    }
    sessionStorage.setItem('release_notes_v6_seen_session', 'true')
    
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
      setShowAnimation(true)
      setTimeout(() => setShowAnimation(false), 2000)
    }, 800)
  }

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleClose()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  if (showAnimation) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#071a12] flex items-center justify-center animate-in fade-in duration-300">
        <GeometricBackground opacity={0.2} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(45,140,111,0.15)_0%,transparent_70%)] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center justify-center animate-in zoom-in-50 fade-in duration-700 ease-out">
            <LogoV2 variant="white" className="h-32 w-auto object-contain drop-shadow-[0_0_40px_rgba(45,140,111,0.8)]" />
            <div className="mt-12 flex items-center gap-3 text-[#2d8c6f] font-black uppercase tracking-[0.2em] text-sm animate-pulse">
               <div className="w-5 h-5 border-[3px] border-current border-t-transparent rounded-full animate-spin"></div>
               Preparando seu ambiente...
            </div>
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  const StepIcon = TOUR_STEPS[currentStep].icon
  const isLast = currentStep === TOUR_STEPS.length - 1

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8 transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${isClosing ? 'opacity-0 backdrop-blur-none' : 'opacity-100 backdrop-blur-xl bg-[#071a12]/90'}`}>
      <GeometricBackground opacity={0.3} />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(45,140,111,0.15)_0%,transparent_70%)] pointer-events-none"></div>

      <div className={`relative z-10 w-full max-w-[1400px] h-[85vh] max-h-[850px] min-h-[600px] bg-white rounded-[40px] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-[#2d8c6f]/20 transition-all duration-1000 transform ${isClosing ? 'scale-90 translate-y-24 opacity-0 rotate-1' : 'scale-100 translate-y-0 opacity-100 rotate-0'}`}>
        
        {/* Lado Esquerdo - Imagem Herói com Parallax/Zoom (40% de largura) */}
        <div className="hidden md:flex w-[40%] bg-[#071a12] relative flex-col justify-center items-center overflow-hidden shrink-0">
          
          <GeometricBackground opacity={0.4} />

          <div className="absolute inset-0 z-10 bg-gradient-to-br from-[#071a12]/40 via-[#040f0a]/80 to-[#040f0a]/95"></div>
          
          <Image 
            src="/release_notes_hero.png" 
            alt="Hero Tour" 
            fill 
            className="object-cover opacity-70 transition-all duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ 
              transform: `scale(${1 + (currentStep * 0.1)}) translate(${currentStep * -10}px, ${currentStep * 10}px) rotate(${currentStep * -1}deg)`,
              filter: `hue-rotate(${currentStep * 15}deg)`
            }}
            priority
          />
          
          {/* Glass Icon Overlay Dinâmico */}
          <div className="relative z-20 flex flex-col items-center justify-center animate-in zoom-in-50 fade-in duration-700 slide-in-from-bottom-12" key={currentStep}>
            <div className="w-40 h-40 rounded-[2rem] bg-white/5 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white shadow-[0_0_80px_rgba(255,255,255,0.15)] rotate-3 hover:rotate-0 transition-transform duration-700">
              <LogoV2 variant="white" className="w-36 h-auto drop-shadow-2xl opacity-100 scale-[1.8]" />
            </div>
            {currentStep > 0 && (
              <div className="mt-10 px-6 py-2.5 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 text-white/90 text-sm font-black uppercase tracking-[0.3em] shadow-2xl">
                Passo {currentStep} de {TOUR_STEPS.length - 1}
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito - Conteúdo do Tour (60% de largura) */}
        <div className="w-full md:w-[60%] flex flex-col bg-white relative overflow-hidden">
          
          {/* Header Progress and Close */}
          <div className="flex justify-between items-center p-8 lg:p-10 border-b border-slate-50/50 relative z-20 bg-white">
            <div className="flex items-center gap-6">
              <LogoV2 className="h-16 w-auto scale-110 origin-left" />
              <div className="hidden sm:block w-px h-8 bg-slate-200"></div>
              <div className="flex gap-2">
                {TOUR_STEPS.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-2 rounded-full transition-all duration-700 ease-out ${i === currentStep ? 'w-10 bg-[#0a2318] shadow-[0_0_15px_rgba(10,35,24,0.3)]' : i < currentStep ? 'w-4 bg-[#0a2318]/40' : 'w-4 bg-slate-100'}`}
                  />
                ))}
              </div>
            </div>
            <button 
              onClick={handleClose}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700 hover:rotate-90 transition-all duration-500"
              title="Pular tour"
            >
              <X size={22} />
            </button>
          </div>

          {/* Slider Content */}
          <div className="flex-1 relative">
            <div 
              className="absolute inset-0 flex transition-transform duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ transform: `translateX(-${currentStep * 100}%)` }}
            >
              {TOUR_STEPS.map((step, i) => (
                <div key={i} className="w-full h-full flex-shrink-0 flex flex-col justify-center p-8 lg:p-14 xl:p-20 overflow-y-auto custom-scrollbar">
                  
                  <div className={`transition-all duration-1000 delay-200 transform ${currentStep === i ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    {i === 0 && (
                      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-50 border border-emerald-100/50 text-emerald-600 text-[11px] font-black uppercase tracking-[0.2em] mb-8 shadow-sm">
                        <Sparkles size={14} /> Atualização v2.0
                      </div>
                    )}
                    
                    <h2 
                      className={`text-[#071a12] tracking-tight leading-[1.1] mb-6 ${i === 0 ? 'text-5xl lg:text-6xl' : 'text-4xl lg:text-5xl'}`}
                      style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 600 }}
                    >
                      {step.title}
                    </h2>
                    
                    <p className={`text-slate-500 leading-relaxed font-medium ${i === 0 ? 'text-xl lg:text-2xl' : 'text-lg lg:text-xl'}`}>
                      {step.description}
                    </p>
                    
                    {i === TOUR_STEPS.length - 1 && (
                      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#071a12]/5 p-8 rounded-3xl border border-[#071a12]/10">
                        {TOUR_STEPS.slice(1, -1).map((s, idx) => {
                          const IconFeature = s.icon
                          return (
                            <div key={idx} className="flex items-center gap-4 text-[14px] font-bold text-[#071a12] animate-in slide-in-from-bottom-4 fade-in duration-500" style={{ animationDelay: `${400 + (idx * 100)}ms`, animationFillMode: 'both' }}>
                              <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                <IconFeature size={18} strokeWidth={2} />
                              </div>
                              <span className="leading-tight">{s.title}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  
                </div>
              ))}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="p-8 lg:p-10 border-t border-slate-50 bg-white/90 backdrop-blur-xl flex justify-between items-center z-20">
            <div className="flex items-center gap-6">
              <button 
                onClick={prevStep}
                className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-all duration-300 ${currentStep === 0 ? 'opacity-0 pointer-events-none -translate-x-8 absolute' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 translate-x-0 relative'}`}
              >
                <ChevronLeft size={20} /> Voltar
              </button>
              
              {isLast && (
                <label className="flex items-center gap-2 cursor-pointer text-[13px] font-bold text-slate-400 hover:text-slate-600 transition-colors animate-in fade-in duration-500">
                  <input 
                    type="checkbox" 
                    checked={dontShowAgain} 
                    onChange={e => setDontShowAgain(e.target.checked)} 
                    className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer" 
                  />
                  Não mostrar novamente
                </label>
              )}
            </div>
            
            <button 
              onClick={nextStep}
              className={`px-10 py-4 lg:px-12 lg:py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center gap-3 transition-all duration-500 shadow-2xl hover:-translate-y-1 hover:scale-105 bg-[#0a2318] hover:bg-[#0d3322] text-white shadow-[#0a2318]/30`}
            >
              {isLast ? 'ACESSAR AGORA' : 'AVANÇAR'}
              {!isLast && <ChevronRight size={20} />}
              {isLast && <Sparkles size={20} />}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
