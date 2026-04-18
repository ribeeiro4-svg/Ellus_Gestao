export const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export function fmtR(v: number): string {
  if (isNaN(v) || v == null) return 'R$ 0,00'
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function roundMoney(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100
}

export function safeSum(a: number, b: number): number {
  return roundMoney((a || 0) + (b || 0))
}

export function safeDiff(a: number, b: number): number {
  return roundMoney((a || 0) - (b || 0))
}

export function fmtPct(v: number): string {
  return (isNaN(v) ? 0 : Math.round(v * 10) / 10) + '%'
}

export function fmtData(d: string): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('pt-BR')
}

export function parseValor(v: unknown): number {
  if (typeof v === 'number') return v
  return parseFloat(String(v || '0').replace(/[R$.\s]/g, '').replace(',', '.')) || 0
}

export function pctMeta(realizado: number, meta: number): number {
  if (meta <= 0) return 0
  return Math.min(100, Math.round((realizado / meta) * 100))
}

export function corMeta(pct: number): string {
  if (pct >= 100) return 'var(--green)'
  if (pct >= 50)  return 'var(--orange)'
  return 'var(--red)'
}

export function statusAssocClass(status: string): string {
  const s = status.toLowerCase()
  if (s.includes('inadimp')) return 'status-inadimplente'
  if (s.includes('inat'))    return 'status-inativo'
  if (s.includes('pend'))    return 'status-pendente'
  return 'status-ativo'
}

export function statusLancClass(status: string): string {
  const s = (status || '').toLowerCase()
  if (s.includes('pago') || s.includes('receb')) return 'status-pago'
  if (s.includes('atrasado')) return 'status-inadimplente'
  if (s.includes('aberto') || s.includes('pend')) return 'status-aberto'
  return 'status-parcial'
}

export function calcVariacaoPct(atual: number, anterior: number): number {
  if (anterior === 0) return 0
  return Math.round((atual - anterior) / anterior * 1000) / 10
}

export function calcAcumulado(arr: number[]): number[] {
  return arr.reduce<number[]>((acc, v) => {
    acc.push((acc[acc.length - 1] || 0) + v)
    return acc
  }, [])
}

export function calcProjecaoAnual(receita: number[]): number {
  const comDados = receita.filter(v => v > 0)
  if (!comDados.length) return 0
  return (comDados.reduce((a, b) => a + b, 0) / comDados.length) * 12
}

// Cookies Helpers for Tenant Identity
export function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=')
    return parts[0] === name ? parts[1] : r
  }, '' as string) || null
}

export function deleteCookie(name: string) {
  setCookie(name, '', -1)
}

/**
 * Extrai o índice do mês (0-11) de forma segura contra fuso horário
 */
export function getMesIdx(dataStr: string): number {
  if (!dataStr) return -1
  if (dataStr.includes('-')) {
    const parts = dataStr.split('-')
    return parseInt(parts[1]) - 1
  } else if (dataStr.includes('/')) {
    const parts = dataStr.split('/')
    return parseInt(parts[1]) - 1
  }
  const d = new Date(dataStr)
  return isNaN(d.getTime()) ? -1 : d.getMonth()
}

/**
 * Extrai o ano de forma segura contra fuso horário
 */
export function getAnoIdx(dataStr: string): number {
  if (!dataStr) return -1
  if (dataStr.includes('-')) {
    return parseInt(dataStr.split('-')[0])
  } else if (dataStr.includes('/')) {
    const parts = dataStr.split('/')
    return parseInt(parts[2])
  }
  return new Date(dataStr).getFullYear()
}
