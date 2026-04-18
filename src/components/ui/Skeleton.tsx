import React from 'react'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  variant?: 'text' | 'circular' | 'rectangular'
}

export default function Skeleton({ className = '', width, height, variant = 'rectangular' }: SkeletonProps) {
  const style: React.CSSProperties = {
    width,
    height,
  }

  const variantClass = {
    text: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-xl'
  }[variant]

  return (
    <div 
      style={style}
      className={`animate-pulse bg-gray-200/60 ${variantClass} ${className}`}
    />
  )
}
