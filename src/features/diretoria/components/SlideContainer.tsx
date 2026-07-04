'use client'
import React from 'react'

interface SlideContainerProps {
  children: React.ReactNode
  direction: 'next' | 'prev' | null
  slideKey: number
}

export default function SlideContainer({ children, direction, slideKey }: SlideContainerProps) {
  return (
    <div
      key={slideKey}
      className={`w-full h-full absolute inset-0 ${
        direction === 'next'
          ? 'animate-slide-in-right'
          : direction === 'prev'
          ? 'animate-slide-in-left'
          : 'animate-fade-in'
      }`}
      style={{ animationDuration: '280ms', animationTimingFunction: 'cubic-bezier(0.4,0,0.2,1)', animationFillMode: 'both' }}
    >
      {children}
    </div>
  )
}
