import jsPDF from 'jspdf'
import { fmtR, fmtData } from '@/lib/utils/formatters'

const GREEN_DARK = [14, 45, 34] as const // #0E2D22
const GREEN_EMERALD = [16, 185, 129] as const // #10B981
const GRAY_TEXT = [100, 116, 139] as const
const BLACK_TEXT = [30, 41, 59] as const

function formatCpf(cpf: string): string {
  if (!cpf) return '--'
  const clean = cpf.replace(/\D/g, '')
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (clean.length === 14) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return cpf
}

export const gerarPdfAbono = (associado: any, lancamento: any, mode: 'download' | 'open' | 'url' = 'download'): string | undefined => {
  const doc = new jsPDF('portrait', 'mm', 'a4') // A4 size: 210mm x 297mm
  
  // Header section banner
  doc.setFillColor(...GREEN_DARK)
  doc.rect(0, 0, 210, 45, 'F')
  
  // Header text
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('ACPROBEC — ASSOCIAÇÃO COLABORATIVA', 20, 18)
  
  doc.setFontSize(22)
  doc.text('RECIBO DE ABONO', 20, 32)
  
  let y = 60
  
  // Main Declarative Text
  doc.setTextColor(...BLACK_TEXT)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  
  const textLines = [
    `Declaramos para os devidos fins que a mensalidade do associado abaixo identificado`,
    `foi ABONADA por deliberação e iniciativa da Diretoria Executiva da ACPROBEC, não restando`,
    `quaisquer pendências ou débitos em aberto relativos a este lançamento.`
  ]
  
  textLines.forEach(line => {
    doc.text(line, 20, y)
    y += 6
  })
  
  y += 12
  
  // Section: Dados do Associado
  y = renderSectionTitle(doc, 'Dados do Associado', y)
  const assocData = [
    ['Nome Completo', associado?.nome || '--'],
    ['CPF/CNPJ', formatCpf(associado?.cpf || '')]
  ]
  y = renderGridData(doc, assocData, y)
  
  y += 10
  
  // Section: Detalhes do Lançamento Abonado
  y = renderSectionTitle(doc, 'Detalhes do Lançamento', y)
  const lancData = [
    ['Descrição', lancamento.descricao || 'Mensalidade'],
    ['Categoria', lancamento.categoria || 'Mensalidade'],
    ['Valor Original', fmtR(lancamento.valor)],
    ['Status Final', 'PAGO (ABONADO)'],
    ['Data do Vencimento', fmtData(lancamento.data)],
    ['Data do Abono', fmtData(lancamento.data)]
  ]
  y = renderGridData(doc, lancData, y)
  
  y += 15
  
  // Section: Observação Importante
  doc.setFillColor(243, 244, 246) // bg-gray-100
  doc.rect(20, y, 170, 22, 'F')
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...GREEN_DARK)
  doc.text('ATENÇÃO / INFORMAÇÃO DE INICIATIVA', 25, y + 6)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...BLACK_TEXT)
  doc.text('Abono concedido por iniciativa exclusiva da ACPROBEC.', 25, y + 12)
  doc.text('Sem custos ou penalidades para o associado.', 25, y + 17)
  
  y += 45
  
  // Signatures
  doc.setDrawColor(209, 213, 219) // grey line
  doc.setLineWidth(0.5)
  doc.line(65, y, 145, y)
  
  doc.setFontSize(8)
  doc.setTextColor(...GRAY_TEXT)
  doc.text('DIRETORIA EXECUTIVA', 105, y + 4, { align: 'center' })
  doc.text('ACPROBEC', 105, y + 8, { align: 'center' })
  
  // Footer
  const pageY = 285
  doc.setDrawColor(243, 244, 246)
  doc.line(20, pageY - 5, 190, pageY - 5)
  
  const now = new Date().toLocaleString('pt-BR')
  doc.text(`Recibo emitido em ${now}`, 20, pageY)
  doc.text('Página 1 de 1', 190, pageY, { align: 'right' })
  
  if (mode === 'open') {
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  } else if (mode === 'url') {
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    return url
  } else {
    const safeName = (associado?.nome || 'recibo').toLowerCase().replace(/[^a-z0-9]/g, '_')
    doc.save(`recibo_abono_${safeName}.pdf`)
  }
}

function renderSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFontSize(11)
  doc.setTextColor(...GREEN_DARK)
  doc.setFont('helvetica', 'bold')
  doc.text(title.toUpperCase(), 20, y)
  doc.setDrawColor(...GREEN_EMERALD)
  doc.setLineWidth(0.7)
  doc.line(20, y + 2, 190, y + 2)
  return y + 10
}

function renderGridData(doc: jsPDF, data: string[][], y: number) {
  doc.setFontSize(8)
  doc.setTextColor(...GRAY_TEXT)
  
  let currentY = y
  data.forEach(([label, value], i) => {
    const col = i % 2 === 0 ? 20 : 110
    if (i % 2 === 0 && i !== 0) currentY += 15
    
    doc.setFont('helvetica', 'bold')
    doc.text(label.toUpperCase(), col, currentY)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...BLACK_TEXT)
    
    // Wrap text if it exceeds column width
    const maxWidth = i % 2 === 0 ? 80 : 80
    const textLines = doc.splitTextToSize(value?.toString() || '--', maxWidth)
    
    let textY = currentY + 5
    textLines.forEach((line: string) => {
      doc.text(line, col, textY)
      textY += 4.5
    })
    
    doc.setFontSize(8)
    doc.setTextColor(...GRAY_TEXT)
  })
  
  return currentY + 16
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
