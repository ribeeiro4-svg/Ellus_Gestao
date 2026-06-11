export default function LogoV2({ className, variant = 'default' }: { className?: string, variant?: 'default' | 'white' }) {
  const textColor = variant === 'white' ? 'rgb(255, 255, 255)' : 'rgb(15, 110, 86)'
  const accentColor = variant === 'white' ? 'rgb(255, 255, 255)' : 'rgb(29, 158, 117)'

  return (
    <svg width="100%" viewBox="0 0 680 320" role="img" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <mask id="imagine-text-gaps-bhctaz" maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="680" height="320" fill="white"/>
          <rect x="230.68368530273438" y="97.44171142578125" width="218.63265991210938" height="103.26284790039062" fill="black" rx="2"/>
          <rect x="213.35667419433594" y="208.147705078125" width="253.28665161132812" height="19.55611801147461" fill="black" rx="2"/>
        </mask>
      </defs>
      <text x="340" y="175" textAnchor="middle" style={{ fill: textColor, fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '82px', fontWeight: 300 }}>
        <tspan style={{ fill: accentColor, fontStyle: 'italic' }}>É</tspan>
        <tspan>llos</tspan>
      </text>
      <line x1="190" y1="200" x2="490" y2="200" mask="url(#imagine-text-gaps-bhctaz)" style={{ stroke: accentColor, strokeWidth: '0.8px' }}/>
      <text x="340" y="222" textAnchor="middle" style={{ fill: textColor, fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '13px', fontWeight: 400 }}>
        GESTÃO ESTRATÉGICA
      </text>
    </svg>
  )
}
