export const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export function fmtR(v: number): string {
  if (isNaN(v) || v == null) return 'R$ 0'
  return 'R$ ' + Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
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
  return 'status-ativo'
}

export function statusLancClass(status: string): string {
  const s = status.toLowerCase()
  if (s.includes('pago') || s.includes('receb')) return 'status-pago'
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
