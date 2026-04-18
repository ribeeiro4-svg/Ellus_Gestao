import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const fmtR = (v: number | string | undefined | null) => {
  const n = typeof v === 'string' ? parseFloat(v) : v || 0
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

export const fmtData = (d: string | Date | undefined | null) => {
  if (!d) return '--'
  
  // Se for string, tenta limpar o fuso horário
  if (typeof d === 'string') {
    const isoDate = d.split('T')[0]
    const parts = isoDate.includes('-') ? isoDate.split('-') : isoDate.split('/')
    
    if (parts.length === 3) {
      if (parts[0].length === 4) { // YYYY-MM-DD
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
      return `${parts[0]}/${parts[1]}/${parts[2]}` // DD/MM/YYYY
    }
  }

  try {
    const date = new Date(d)
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  } catch (e) {
    return '--'
  }
}

export const fmtHora = (d: string | Date) => {
  return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export const fmtPct = (v: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1 }).format(v / 100)
}

export const safeSum = (a: number, b: number) => {
  return Math.round((a + b) * 100) / 100
}

export const safeDiff = (a: number, b: number) => {
  return Math.round((a - b) * 100) / 100
}

export const MESES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
]

export const FORMAS_PAGAMENTO = [
  'Dinheiro', 'PIX', 'Boleto', 'Cartão Crédito', 'Cartão Débito', 'Transferência'
]

export const STATUS_LANCAMENTO = [
  { value: 'pago', label: 'Pago', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'aberto', label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
  { value: 'atrasado', label: 'Atrasado', color: 'bg-rose-100 text-rose-700' }
]

/**
 * Pega o índice do mês (0-11) de forma robusta ignorando fuso horário.
 * Aceita "YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ssZ" ou "DD/MM/YYYY"
 */
export function getMesIdx(dataStr: any): number {
  if (!dataStr) return -1
  const str = String(dataStr).trim()
  
  if (str.includes('-')) {
    const cleanStr = str.split('T')[0].split(' ')[0]
    const parts = cleanStr.split('-')
    if (parts.length >= 2) {
      // Se parts[0] tem 4 dígitos, é YYYY-MM-DD
      const mesStr = parts[0].length === 4 ? parts[1] : parts[1]
      return (parseInt(mesStr, 10) || 0) - 1
    }
  } 
  
  if (str.includes('/')) {
    const parts = str.split('/')
    if (parts.length >= 2) {
      // DD/MM/YYYY ou MM/YYYY
      const mesStr = parts[1]
      return (parseInt(mesStr, 10) || 0) - 1
    }
  }

  return -1
}

/**
 * Pega o ano (YYYY) de forma robusta.
 */
export function getAnoIdx(dataStr: any): number {
  if (!dataStr) return -1
  const str = String(dataStr).trim()
  
  if (str.includes('-')) {
    const cleanStr = str.split('T')[0].split(' ')[0]
    const parts = cleanStr.split('-')
    if (parts.length >= 1) {
      return parts[0].length === 4 ? parseInt(parts[0], 10) : parseInt(parts[2], 10)
    }
  } 
  
  if (str.includes('/')) {
    const parts = str.split('/')
    if (parts.length >= 3) {
      return parseInt(parts[2], 10)
    }
  }

  return -1
}
