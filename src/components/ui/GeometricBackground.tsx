import React from 'react'

interface GeometricBackgroundProps {
  opacity?: number
  className?: string
  color?: string
}

/**
 * Componente de Fundo Geométrico Oficial ACPROBEC
 * Replica a malha hexagonal técnica utilizada em todo o ecossistema ÁUREA Tech.
 */
export default function GeometricBackground({ 
  opacity = 1, 
  className = "",
  color = "%232d8c6f" // Cor esmeralda padrão (URL Encoded)
}: GeometricBackgroundProps) {
  
  // SVG original do globals.css
  const svgPattern = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66z' fill='none' stroke='${color}' stroke-width='0.8' stroke-opacity='0.28'/%3E%3Cpath d='M28 100L0 84V52l28-16 28 16v32L28 100z' fill='none' stroke='${color}' stroke-width='0.8' stroke-opacity='0.22'/%3E%3C/svg%3E`

  return (
    <div 
      className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-700 ${className}`}
      style={{ 
        backgroundImage: `url("${svgPattern}")`,
        backgroundSize: '56px 100px',
        opacity: opacity
      }}
      aria-hidden="true"
    />
  )
}
