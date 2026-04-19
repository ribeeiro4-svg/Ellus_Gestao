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
  if (typeof d === 'string') {
    const isoDate = d.split('T')[0]
    const parts = isoDate.includes('-') ? isoDate.split('-') : isoDate.split('/')
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`
      return `${parts[0]}/${parts[1]}/${parts[2]}`
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
  return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1 }).format((v || 0) / 100)
}

export const pctMeta = (atual: number, meta: number) => {
  if (!meta || meta === 0) return 0
  return Math.round((atual / meta) * 100)
}

export const roundMoney = (v: number) => {
  return Math.round(v * 100) / 100
}

export const safeSum = (a: number, b: number) => {
  return Math.round(((a || 0) + (b || 0)) * 100) / 100
}

export const safeDiff = (a: number, b: number) => {
  return Math.round(((a || 0) - (b || 0)) * 100) / 100
}

export const statusAssocClass = (s: string) => {
  switch (s?.toLowerCase()) {
    case 'ativo': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'inadimplente': return 'bg-rose-100 text-rose-700 border-rose-200'
    case 'cancelado': return 'bg-slate-100 text-slate-700 border-slate-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export const statusLancClass = (s: string) => {
  switch (s?.toLowerCase()) {
    case 'pago': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'aberto': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'atrasado': return 'bg-rose-100 text-rose-700 border-rose-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export const deleteCookie = (name: string) => {
  document.cookie = name + '=; Max-Age=-99999999; path=/;'
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

export function getBruto(l: any): number {
  if (!l) return 0
  const match = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/)
  const taxaVal = match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0
  const v = Number(l.valor) || 0
  return Math.round((v + taxaVal) * 100) / 100
}

export function getMesIdx(dataStr: any): number {
  if (!dataStr) return -1
  if (dataStr instanceof Date) return dataStr.getMonth()
  const str = String(dataStr).trim()
  
  // Detecção prioritária de formato ISO YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return (parseInt(isoMatch[2], 10) || 0) - 1

  if (str.includes('-')) {
    const parts = str.split('T')[0].split(' ')[0].split('-')
    if (parts.length >= 2) {
      const mes = parts[0].length === 4 ? parts[1] : parts[1]
      return (parseInt(mes, 10) || 0) - 1
    }
  } 
  
  if (str.includes('/')) {
    const parts = str.split('/')
    if (parts.length >= 2) {
      // Formato BR: DD/MM/YYYY ou YYYY/MM/DD
      const mes = parts[0].length === 4 ? parts[1] : parts[1]
      return (parseInt(mes, 10) || 0) - 1
    }
  }

  try {
    const d = new Date(str)
    if (!isNaN(d.getTime())) return d.getMonth()
  } catch (e) {}

  return -1
}

export function getAnoIdx(dataStr: any): number {
  if (!dataStr) return -1
  if (dataStr instanceof Date) return dataStr.getFullYear()
  const str = String(dataStr).trim()
  
  if (str.includes('-')) {
    const parts = str.split('T')[0].split(' ')[0].split('-')
    if (parts.length >= 1) {
      return parts[0].length === 4 ? parseInt(parts[0], 10) : parseInt(parts[2], 10)
    }
  } 
  
  if (str.includes('/')) {
    const parts = str.split('/')
    if (parts.length >= 1) {
      const last = parts[parts.length - 1]
      if (last.length === 4) return parseInt(last, 10)
    }
  }

  try {
    const d = new Date(str)
    if (!isNaN(d.getTime())) return d.getFullYear()
  } catch (e) {}

  return -1
}
