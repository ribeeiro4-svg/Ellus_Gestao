'use client'
import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SlideNavProps {
  current: number
  total: number
  onPrev: () => void
  onNext: () => void
  slideTitle: string
}

export default function SlideNav({ current, total, onPrev, onNext, slideTitle }: SlideNavProps) {
  return (
    <>
      {/* Top progress bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center gap-2 px-8 pt-3">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-[3px] flex-1 rounded-full transition-all duration-500 ${
              i === current
                ? 'bg-emerald-400'
                : i < current
                ? 'bg-emerald-400/40'
                : 'bg-white/15'
            }`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-5 right-8 z-50 text-[13px] font-black text-white/70 uppercase tracking-widest">
        {current + 1} / {total}
      </div>

      {/* Slide title */}
      <div className="absolute top-7 left-1/2 -translate-x-1/2 z-50 text-[13px] font-black text-white/80 uppercase tracking-widest">
        {slideTitle}
      </div>

      {/* Left arrow */}
      {current > 0 && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-white/15 hover:text-white transition-all opacity-0 hover:opacity-100 group-hover:opacity-100 duration-200"
          aria-label="Slide anterior"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Right arrow */}
      {current < total - 1 && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-white/15 hover:text-white transition-all opacity-0 hover:opacity-100 group-hover:opacity-100 duration-200"
          aria-label="Próximo slide"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Dot indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-400 ${
              i === current ? 'w-5 h-1.5 bg-emerald-400' : 'w-1.5 h-1.5 bg-white/20'
            }`}
          />
        ))}
      </div>
    </>
  )
}
