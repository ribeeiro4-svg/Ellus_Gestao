'use client'
import React, { useEffect, useRef } from 'react'

interface CountUpProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number
  className?: string
}

export default function CountUp({ value, prefix = '', suffix = '', decimals = 0, duration = 900, className = '' }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (!ref.current) return
    startRef.current = null
    const startVal = 0

    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startVal + (value - startVal) * eased

      if (ref.current) {
        if (decimals > 0) {
          ref.current.textContent = prefix + current.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix
        } else {
          ref.current.textContent = prefix + Math.round(current).toLocaleString('pt-BR') + suffix
        }
      }

      if (progress < 1) requestAnimationFrame(animate)
    }

    const raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [value, prefix, suffix, decimals, duration])

  return <span ref={ref} className={className}>{prefix}0{suffix}</span>
}
