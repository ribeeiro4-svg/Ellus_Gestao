// PaymentBadge.tsx — Mini-componente para exibir forma de pagamento com ícone
interface PaymentBadgeProps {
  method?: string | null
  size?: 'sm' | 'md'
}

const ICONS: Record<string, string> = {
  'Dinheiro': '💵',
  'PIX': '⚡',
  'Boleto': '🔖',
  'Transferência': '🏦',
  'Cartão': '💳',
}

const COLORS: Record<string, { bg: string; color: string }> = {
  'Dinheiro': { bg: 'rgba(16,185,129,.12)', color: '#065f46' },
  'PIX': { bg: 'rgba(45,140,111,.12)', color: '#2d8c6f' },
  'Boleto': { bg: 'rgba(245,158,11,.12)', color: '#92400e' },
  'Transferência': { bg: 'rgba(139,92,246,.12)', color: '#6d28d9' },
  'Cartão': { bg: 'rgba(79,126,248,.12)', color: '#2d5aaf' },
}

export default function PaymentBadge({ method, size = 'sm' }: PaymentBadgeProps) {
  if (!method) {
    return <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>—</span>
  }

  const icon = ICONS[method] || '💳'
  const colors = COLORS[method] || { bg: 'var(--surface3)', color: 'var(--text3)' }
  const padding = size === 'sm' ? '2px 8px' : '4px 12px'
  const fontSize = size === 'sm' ? 11 : 12

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding,
        borderRadius: 20,
        fontSize,
        fontWeight: 700,
        background: colors.bg,
        color: colors.color,
        whiteSpace: 'nowrap',
      }}
    >
      <span>{icon}</span>
      {method}
    </span>
  )
}
