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
  const vA = Math.round((a || 0) * 100)
  const vB = Math.round((b || 0) * 100)
  return (vA + vB) / 100
}

export const safeDiff = (a: number, b: number) => {
  const vA = Math.round((a || 0) * 100)
  const vB = Math.round((b || 0) * 100)
  return (vA - vB) / 100
}

export const statusAssocClass = (s: string) => {
  switch (s?.toLowerCase()) {
    case 'ativo': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'inadimplente': return 'bg-rose-100 text-rose-700 border-rose-200'
    case 'cancelado': return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'abonado': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export const statusLancClass = (s: string) => {
  switch (s?.toLowerCase()) {
    case 'pago': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'abonado': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
    case 'aberto': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'atrasado': return 'bg-rose-100 text-rose-700 border-rose-200'
    case 'processando': return 'bg-blue-100 text-blue-700 border-blue-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export const statusCobrancaClass = (s: string) => {
  switch (s?.toUpperCase()) {
    case 'EM COBRANÇA': return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'NEGOCIADO': return 'bg-violet-100 text-violet-700 border-violet-200'
    default: return 'bg-slate-100 text-slate-500 border-slate-200'
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
  const v = Math.abs(Number(l.valor) || 0)
  let t = Math.abs(Number(l.taxa) || 0)
  
  if (t === 0) {
    const match = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/)
    if (match) {
      t = Math.abs(parseFloat(match[1].replace(/\./g, '').replace(',', '.')))
    }
  }

  return Math.round((v + t) * 100) / 100
}

export function getNet(l: any): number {
  if (!l) return 0
  return Math.abs(Number(l.valor) || 0)
}

export function getMesIdx(dataStr: any): number {
  if (!dataStr) return -1
  try {
    const s = String(dataStr)
    // Tenta formato DD/MM/AAAA
    if (s.includes('/')) {
      const parts = s.split('/')
      if (parts.length >= 2) return parseInt(parts[1]) - 1
    }
    // Tenta formato AAAA-MM-DD
    if (s.includes('-')) {
      const parts = s.split('T')[0].split('-')
      if (parts.length >= 2) {
        // Se a primeira parte tiver 4 dígitos, é AAAA-MM-DD
        if (parts[0].length === 4) return parseInt(parts[1]) - 1
        // Se a última parte tiver 4 dígitos, é DD-MM-AAAA
        return parseInt(parts[1]) - 1
      }
    }
    const d = new Date(dataStr)
    return isNaN(d.getTime()) ? -1 : d.getUTCMonth()
  } catch (e) {
    return -1
  }
}

export function getAnoIdx(dataStr: any): number {
  if (!dataStr) return -1
  try {
    const s = String(dataStr)
    if (s.includes('/')) {
      const parts = s.split('/')
      if (parts.length >= 3) return parseInt(parts[2])
    }
    if (s.includes('-')) {
      const parts = s.split('T')[0].split('-')
      if (parts.length >= 1) {
        if (parts[0].length === 4) return parseInt(parts[0])
        if (parts.length >= 3) return parseInt(parts[2])
      }
    }
    const d = new Date(dataStr)
    return isNaN(d.getTime()) ? -1 : d.getUTCFullYear()
  } catch (e) {
    return -1
  }
}

export function getDiaIdx(dataStr: any): number {
  if (!dataStr) return -1
  try {
    const s = String(dataStr)
    if (s.includes('/')) {
      const parts = s.split('/')
      if (parts.length >= 1) return parseInt(parts[0])
    }
    if (s.includes('-')) {
      const parts = s.split('T')[0].split('-')
      if (parts.length >= 3) {
        if (parts[0].length === 4) return parseInt(parts[2])
        return parseInt(parts[0])
      }
    }
    const d = new Date(dataStr)
    return isNaN(d.getTime()) ? -1 : d.getUTCDate()
  } catch (e) {
    return -1
  }
}

export function isRealized(l: any): boolean {
  if (!l) return false
  if (!!l.data_conciliacao) return true
  const s = (l.status || '').toLowerCase()
  return ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso', 'parcial'].includes(s)
}
