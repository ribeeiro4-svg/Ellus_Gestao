import * as XLSX from 'xlsx'

export const parseExcelDate = (val: any) => {
  if (!val) return new Date().toISOString()
  if (val instanceof Date) return val.toISOString()
  if (typeof val === 'number') {
    return new Date((val - 25569) * 86400 * 1000).toISOString()
  }
  if (typeof val === 'string' && val.includes('/')) {
    const parts = val.split('/')
    if (parts.length === 3) {
      const [d, m, y] = parts
      const date = new Date(Number(y), Number(m) - 1, Number(d))
      if (!isNaN(date.getTime())) return date.toISOString()
    }
  }
  const parsed = new Date(val)
  return !isNaN(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString()
}

export const downloadTemplate = (type: 'financeiro' | 'associados' | 'prolabore') => {
  let data: any[][] = []
  let filename = ''
  
  if (type === 'financeiro') {
    data = [
      ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status', 'Forma Pagamento', 'Nome da Conta', 'Recorrência Ativa', 'Valor Recebido', 'Troco via PIX', 'Competência Mês', 'Competência Ano', 'Taxa'],
      ['2024-04-01', 'Mensalidade Abril', 'Mensalidade', 'Receita', 150.00, 'Recebido', 'PIX', 'Cora ACPROBEC', 'Sim', 150.00, 'Não', 4, 2024, 0]
    ]
    filename = 'modelo_financeiro.xlsx'
  } else if (type === 'associados') {
    data = [
      ['ID', 'Nome', 'CPF / CNPJ', 'Categoria', 'Email', 'Telefone', 'Data Ingresso', 'Mensalidade', 'Status', 'Vencimento Dia', 'Recorrência Ativa', 'Plano de Saúde', 'Status Termo'],
      ['1001', 'João da Silva', '12345678901', 'Pleno', 'joao@email.com', '(11) 99999-9999', '2023-01-10', 150.00, 'Ativo', 10, 'Sim', 'Ativo', 'Assinado']
    ]
    filename = 'modelo_associados.xlsx'
  } else if (type === 'prolabore') {
    data = [
      ['Nome do Diretor', 'Valor Mensal', 'Mês Início', 'Ano Início', 'Mês Fim', 'Ano Fim'],
      ['Diretor Presidente', 3000.00, 1, 2024, 6, 2024]
    ]
    filename = 'modelo_prolabore.xlsx'
  }

  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Modelo')
  
  // Use manual download for better browser support
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

export const exportToExcel = (data: any[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Dados')
  
  // Use manual download for better browser support
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}
