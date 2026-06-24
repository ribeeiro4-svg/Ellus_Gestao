'use client'
import React, { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export default function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const container = document.getElementById('main-scroll-container')
    if (!container) return

    const handleScroll = () => {
      if (container.scrollTop > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    const container = document.getElementById('main-scroll-container')
    if (container) {
      container.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }

  if (!isVisible) return null

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 animate-in fade-in zoom-in-75 duration-300"
      title="Voltar ao Topo"
    >
      <ArrowUp size={24} />
    </button>
  )
}
