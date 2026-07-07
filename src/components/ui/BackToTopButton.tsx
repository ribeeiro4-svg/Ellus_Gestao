'use client'
import React, { useState, useEffect } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'

export default function BackToTopButton() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const scrollToTop = () => {
    const container = document.getElementById('main-scroll-container')
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const scrollToBottom = () => {
    const container = document.getElementById('main-scroll-container')
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    }
  }

  // Ensures it doesn't cause hydration mismatch but always renders on client
  if (!isMounted) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 animate-in fade-in zoom-in-75 duration-300">
      <button
        onClick={scrollToTop}
        className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-full shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:from-emerald-400 hover:to-teal-300 hover:-translate-y-1 transition-all active:scale-95 backdrop-blur-sm opacity-30 hover:opacity-100"
        title="Voltar ao Topo"
      >
        <ArrowUp size={20} />
      </button>
      <button
        onClick={scrollToBottom}
        className="p-3 bg-gradient-to-br from-emerald-500 to-teal-400 text-white rounded-full shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:from-emerald-400 hover:to-teal-300 hover:translate-y-1 transition-all active:scale-95 backdrop-blur-sm opacity-30 hover:opacity-100"
        title="Ir para o Final"
      >
        <ArrowDown size={20} />
      </button>
    </div>
  )
}
