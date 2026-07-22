import { statusAssocClass, statusLancClass } from '@/lib/utils/formatters'

interface StatusBadgeProps {
  status: string
  type: 'associado' | 'lancamento'
  label?: string
}

export default function StatusBadge({ status, type, label }: StatusBadgeProps) {
  const className = type === 'associado' ? statusAssocClass(status) : statusLancClass(status)
  
  return (
    <span className={`status-badge ${className}`}>
      {label || status}
    </span>
  )
}
