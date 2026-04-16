import { statusAssocClass, statusLancClass } from '@/lib/utils/formatters'

interface StatusBadgeProps {
  status: string
  type: 'associado' | 'lancamento'
}

export default function StatusBadge({ status, type }: StatusBadgeProps) {
  const className = type === 'associado' ? statusAssocClass(status) : statusLancClass(status)
  
  return (
    <span className={`status-badge ${className}`}>
      {status}
    </span>
  )
}
