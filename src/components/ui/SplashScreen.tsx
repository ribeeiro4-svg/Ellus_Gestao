'use client'
import React, { useEffect, useState } from 'react'

const LOADING_MESSAGES = [
  'Inicializando sistema...',
  'Carregando módulos...',
  'Preparando dashboard...',
  'Configurando relatórios...',
  'Pronto!'
]

export default function SplashScreen() {
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('Inicializando sistema...')
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  const [showEnterBtn, setShowEnterBtn] = useState(false)

  useEffect(() => {
    // Progress bar animation
    const steps = [
      { delay: 0, pct: 20, msg: LOADING_MESSAGES[0] },
      { delay: 400, pct: 40, msg: LOADING_MESSAGES[1] },
      { delay: 800, pct: 65, msg: LOADING_MESSAGES[2] },
      { delay: 1200, pct: 85, msg: LOADING_MESSAGES[3] },
      { delay: 1700, pct: 100, msg: LOADING_MESSAGES[4] },
    ]

    steps.forEach((step) => {
      setTimeout(() => {
        setProgress(step.pct)
        setMessage(step.msg)
      }, step.delay)
    })

    // Show enter button
    setTimeout(() => {
      setShowEnterBtn(true)
    }, 2200)
  }, [])

  const handleEnter = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
    }, 680)
  }

  if (!isVisible) return null

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#071a12] transition-all duration-700 ${
        isExiting ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100'
      }`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Background with Hex Grid Shifting */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-[-20%] animate-hex-shift opacity-100"
          style={{
            backgroundImage: `
              repeating-linear-gradient(60deg, transparent, transparent 28px, rgba(45,140,111,0.07) 28px, rgba(45,140,111,0.07) 30px),
              repeating-linear-gradient(-60deg, transparent, transparent 28px, rgba(45,140,111,0.07) 28px, rgba(45,140,111,0.07) 30px),
              repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(45,140,111,0.04) 28px, rgba(45,140,111,0.04) 30px)
            `
          }}
        />
        <div className="absolute top-[-150px] left-[-100px] w-[600px] h-[600px] rounded-full blur-[80px] bg-[radial-gradient(circle,rgba(45,140,111,0.3)_0%,transparent_70%)] animate-pulse" />
        <div className="absolute bottom-[-100px] right-[-80px] w-[500px] h-[500px] rounded-full blur-[80px] bg-[radial-gradient(circle,rgba(14,45,34,0.8)_0%,rgba(45,140,111,0.15)_60%,transparent_70%)] animate-pulse" style={{ animationDelay: '-3s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-[340px] px-6">
        <div className="mb-10 text-center animate-bounce-slow">
           <div className="w-20 h-20 bg-gradient-to-br from-[#2d8c6f] to-[#34d399] rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-2xl shadow-[#2d8c6f]/40 mb-4 mx-auto">
             AC
           </div>
           <h1 className="text-3xl font-bold text-white tracking-widest">ACPROBEC</h1>
           <p className="text-[10px] text-[rgba(255,255,255,0.3)] tracking-[0.3em] font-medium mt-2 uppercase">Gestão Inteligente INOVACONT</p>
        </div>

        {/* Loader Wrapper */}
        <div className={`w-full transition-all duration-500 ${showEnterBtn ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
            <div 
              className="h-full bg-gradient-to-r from-[#2d8c6f] to-[#34d399] rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(45,140,111,0.5)]" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-center mt-4 h-5">
            <p className="text-[11px] text-[rgba(255,255,255,0.4)] tracking-wide font-medium">{message}</p>
          </div>
        </div>

        {/* Enter Button */}
        <button 
          onClick={handleEnter}
          className={`absolute bottom-[-120px] transition-all duration-700 w-full h-14 bg-white text-[#0e2d22] rounded-xl font-bold text-sm shadow-2xl shadow-black/20 transform ${
            showEnterBtn ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
          } active:scale-[0.98] active:bg-gray-100`}
        >
          ACESSAR DASHBOARD
        </button>
      </div>

      <style jsx>{`
        @keyframes hexShift {
          from { transform: translate(0,0); }
          to   { transform: translate(60px, 34px); }
        }
        .animate-hex-shift {
          animation: hexShift 20s linear infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
