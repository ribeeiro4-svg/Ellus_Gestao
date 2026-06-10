export const formatCpfCnpj = (v: string | undefined | null) => {
  if (!v) return 'Não informado'
  const clean = v.replace(/\D/g, '')
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (clean.length === 14) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return v
}

export const formatAssociadoDesde = (dateStr: string | undefined | null) => {
  if (!dateStr) return 'Não informado'
  try {
    const date = new Date(dateStr + 'T12:00:00Z')
    const mes = String(date.getMonth() + 1).padStart(2, '0')
    const ano = date.getFullYear()
    return `${mes}.${ano}`
  } catch (e) {
    return dateStr
  }
}

export const formatFullDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return '--'
  try {
    return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('pt-BR')
  } catch (e) {
    return '--'
  }
}

export const getFileName = (nome: string, desde: string) => {
  const cleanNome = nome.trim()
  return `Ficha do Associado - ${cleanNome} - associado desde ${desde}`
}
