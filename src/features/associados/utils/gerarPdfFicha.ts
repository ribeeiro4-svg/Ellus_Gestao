import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCpfCnpj, formatAssociadoDesde, getFileName } from './formatarDadosFicha'
import { fmtR, MESES } from '@/lib/utils/formatters'

const GREEN_PRIMARY = [29, 158, 117] as const // #1D9E75
const GRAY_TEXT = [100, 116, 139] as const
const BLACK_TEXT = [30, 41, 59] as const

export const gerarPdfFicha = async (associado: any, extrato: any[], atendimentos: any[] = []) => {
  const doc = new jsPDF()
  const desdeStr = formatAssociadoDesde(associado.data_assinatura || associado.data_ingresso)
  
  // --- PÁGINA 1: DADOS CADASTRAIS ---
  renderHeader(doc, 'Ficha do Associado', associado.nome)
  
  let y = 50
  
  // Seção: Identificação
  y = renderSectionTitle(doc, 'Identificação', y)
  const identData = [
    ['Nome Completo', associado.nome],
    ['CPF/CNPJ', formatCpfCnpj(associado.cpf)],
    ['E-mail', associado.email || '--'],
    ['Associado desde', desdeStr],
    ['Plano de Saúde', associado.plano_saude || '--']
  ]
  y = renderGridData(doc, identData, y)
  
  y += 10
  
  // Seção: Dados do HGU Saúde
  y = renderSectionTitle(doc, 'Dados do HGU Saúde', y)
  const hguData = [
    ['Código HGU Titular', associado.codigo_hgu || 'Sem código'],
    ['Data de Inclusão no Plano', associado.data_inclusao_plano ? new Date(associado.data_inclusao_plano + 'T12:00:00Z').toLocaleDateString('pt-BR') : '--']
  ]
  y = renderGridData(doc, hguData, y)
  
  if (Array.isArray(associado.dependentes) && associado.dependentes.length > 0) {
    const depsTableData = associado.dependentes.map((dep: any) => [
      dep.nome,
      dep.codigo_hgu || '--'
    ])
    
    autoTable(doc, {
      startY: y - 5,
      head: [['Nome do Dependente', 'Código HGU']],
      body: depsTableData,
      theme: 'grid',
      headStyles: { fillColor: [29, 158, 117], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3, textColor: [100, 116, 139] },
      margin: { left: 20, right: 20 }
    })
    
    y = (doc as any).lastAutoTable.finalY + 10
  }
  
  // Seção: Dados Financeiros
  y = renderSectionTitle(doc, 'Dados Financeiros', y)
  const finData = [
    ['Vencimento', `Dia ${associado.vencimento_dia || 10}`],
    ['Valor Mensalidade', fmtR(associado.mensalidade)],
    ['Recorrência', associado.recorrencia_ativa ? 'ATIVA' : 'NÃO'],
    ['Conta de Recebimento', associado.conta_recorrencia || '--']
  ]
  y = renderGridData(doc, finData, y)
  
  y += 10
  
  // Seção: Status e Assinaturas
  y = renderSectionTitle(doc, 'Status e Assinaturas', y)
  const statusData = [
    ['Status Geral', (associado.status || 'Pendente').toUpperCase()],
    ['Termo Assinado', (associado.termo_status || 'Pendente').toUpperCase()],
    ['Sincronizado em', associado.zapsign_sync_at ? new Date(associado.zapsign_sync_at).toLocaleDateString('pt-BR') : '--']
  ]
  y = renderGridData(doc, statusData, y)
  
  // Rodapé da Página 1
  renderFooter(doc, 1, 3)
  
  // --- PÁGINA 2: EXTRATO FINANCEIRO ---
  doc.addPage()
  const anoCorrente = new Date().getFullYear()
  renderHeader(doc, `Extrato Financeiro ${anoCorrente}`, associado.nome)
  
  y = 50
  
  // Resumo Financeiro
  const totalPago = extrato.filter(m => m.status === 'pago' || m.status === 'adesao').reduce((acc, curr) => acc + curr.valor, 0)
  const totalAberto = extrato.filter(m => m.status === 'pendente').reduce((acc, curr) => acc + curr.valor, 0)
  const situacao = totalAberto > 0 ? 'Com Pendências' : 'Em Dia'
  
  doc.setFontSize(9)
  doc.setTextColor(...GRAY_TEXT)
  doc.text('RESUMO DO ANO:', 20, y)
  y += 6
  
  doc.setFontSize(11)
  doc.setTextColor(...BLACK_TEXT)
  doc.text(`Total Pago: ${fmtR(totalPago)}   |   Total em Aberto: ${fmtR(totalAberto)}   |   Situação: ${situacao}`, 20, y)
  y += 15
  
  // Grade de Meses
  const tableData = []
  for (let i = 0; i < 12; i += 3) {
    const row = []
    for (let j = 0; j < 3; j++) {
      const idx = i + j
      const mesData = extrato[idx] || { mes: MESES[idx], valor: 0, status: 'vazio' }
      row.push(`${mesData.mes.toUpperCase()}\n${fmtR(mesData.valor)}\n${mesData.status.toUpperCase()}`)
    }
    tableData.push(row)
  }
  
  autoTable(doc, {
    startY: y,
    head: [],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 8,
      halign: 'center',
      valign: 'middle',
      font: 'helvetica',
      lineWidth: 0.5,
      lineColor: [240, 240, 240]
    },
    didParseCell: (data) => {
      const text = data.cell.text[2] || ''
      if (text === 'PAGO') data.cell.styles.fillColor = [209, 250, 229] // bg-emerald-100
      if (text === 'ADESAO') data.cell.styles.fillColor = [219, 234, 254] // bg-blue-100
      if (text === 'PENDENTE') data.cell.styles.fillColor = [254, 243, 199] // bg-amber-100
    }
  })
  
  // Rodapé da Página 2
  renderFooter(doc, 2, 3)

  // --- PÁGINA 3: HISTÓRICO DE ATENDIMENTOS ---
  doc.addPage()
  renderHeader(doc, 'Histórico de Atendimentos', associado.nome)
  
  y = 50
  
  const atendTableData = (atendimentos || []).map(a => {
    const dataAtendimento = a.data_agendamento ? new Date(a.data_agendamento) : a.created_at ? new Date(a.created_at) : null
    const dataStr = dataAtendimento 
      ? `${dataAtendimento.toLocaleDateString('pt-BR')} ${dataAtendimento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
      : '--'
    const isAgendado = !!a.responsavel_id
    const tipo = isAgendado ? 'Agendamento' : 'Avulso'
    const responsavelPresencial = a.responsavel_setor || '--'
    const status = (a.status === 'em_andamento' ? 'Em Andamento' : a.status || '').toUpperCase()
    const observacao = a.etapas_concluidas?.observacao || '--'
    
    return [dataStr, tipo, responsavelPresencial, status, observacao]
  })

  if (atendTableData.length === 0) {
    doc.setFontSize(10)
    doc.setTextColor(...GRAY_TEXT)
    doc.setFont('helvetica', 'italic')
    doc.text('Nenhum atendimento registrado para este associado.', 20, y)
  } else {
    autoTable(doc, {
      startY: y,
      head: [['DATA/HORA', 'TIPO', 'RESP. PRESENCIAL', 'STATUS', 'OBSERVAÇÃO']],
      body: atendTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [29, 158, 117],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 5,
        valign: 'middle',
        font: 'helvetica',
        lineWidth: 0.5,
        lineColor: [240, 240, 240]
      },
      columnStyles: {
        4: { cellWidth: 70 }
      }
    })
  }

  // Rodapé da Página 3
  renderFooter(doc, 3, 3)
  
  // Download
  const fileName = getFileName(associado.nome, desdeStr)
  doc.save(`${fileName}.pdf`)
}

// Funções Auxiliares de Renderização
function renderHeader(doc: jsPDF, title: string, name: string) {
  // Faixa Verde
  doc.setFillColor(...GREEN_PRIMARY)
  doc.rect(0, 0, 210, 40, 'F')
  
  // Texto Header
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('ACPROBEC — GESTÃO INTELIGENTE', 20, 15)
  
  doc.setFontSize(18)
  doc.text(title, 20, 28)
  
  // Nome do Associado
  doc.setFontSize(12)
  doc.text(name.toUpperCase(), 190, 28, { align: 'right' })
}

function renderSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFontSize(11)
  doc.setTextColor(...GREEN_PRIMARY)
  doc.setFont('helvetica', 'bold')
  doc.text(title.toUpperCase(), 20, y)
  doc.setDrawColor(...GREEN_PRIMARY)
  doc.setLineWidth(0.5)
  doc.line(20, y + 2, 190, y + 2)
  return y + 10
}

function renderGridData(doc: jsPDF, data: string[][], y: number) {
  doc.setFontSize(8)
  doc.setTextColor(...GRAY_TEXT)
  doc.setFont('helvetica', 'normal')
  
  let currentY = y
  data.forEach(([label, value], i) => {
    const col = i % 2 === 0 ? 20 : 110
    if (i % 2 === 0 && i !== 0) currentY += 12
    
    doc.setFont('helvetica', 'bold')
    doc.text(label.toUpperCase(), col, currentY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...BLACK_TEXT)
    doc.text(value?.toString() || '--', col, currentY + 5)
    doc.setFontSize(8)
    doc.setTextColor(...GRAY_TEXT)
  })
  
  return currentY + 15
}

function renderFooter(doc: jsPDF, page: number, total: number) {
  const y = 285
  doc.setDrawColor(240, 240, 240)
  doc.line(20, y - 5, 190, y - 5)
  
  doc.setFontSize(8)
  doc.setTextColor(...GRAY_TEXT)
  const now = new Date().toLocaleString('pt-BR')
  doc.text(`Gerado em ${now}`, 20, y)
  doc.text(`Página ${page} de ${total}`, 190, y, { align: 'right' })
}
