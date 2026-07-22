import { PrioridadeTarefa } from '@/lib/types'

export const getPrioridadeColor = (prioridade: PrioridadeTarefa) => {
  switch (prioridade) {
    case 'Alta':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-600',
        border: 'border-rose-100',
        dot: 'bg-rose-500'
      }
    case 'Média':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        border: 'border-amber-100',
        dot: 'bg-amber-500'
      }
    case 'Baixa':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        border: 'border-emerald-100',
        dot: 'bg-emerald-500'
      }
    default:
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-600',
        border: 'border-slate-100',
        dot: 'bg-slate-500'
      }
  }
}
