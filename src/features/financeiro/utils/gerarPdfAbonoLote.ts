import jsPDF from 'jspdf'
import { fmtData } from '@/lib/utils/formatters'

const GREEN_DARK = [14, 45, 34] as const
const GREEN_EMERALD = [16, 185, 129] as const
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

export const gerarPdfAbonoLote = (lancamentosAbonados: any[], associados: any[], mode: 'download' | 'open' | 'url' = 'download'): string | undefined => {
  const doc = new jsPDF('portrait', 'mm', 'a4')
  
  // Header section banner
  doc.setFillColor(...GREEN_DARK)
  doc.rect(0, 0, 210, 45, 'F')
  
  // Header text
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('ACPROBEC — ASSOCIAÇÃO COLABORATIVA', 20, 18)
  
  doc.setFontSize(22)
  doc.text('RECIBO DE ABONO EM LOTE', 20, 32)
  
  let y = 60
  
  // Main Declarative Text
  doc.setTextColor(...BLACK_TEXT)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  
  const textLines = [
    `Declaramos para os devidos fins que as mensalidades dos associados abaixo identificados`,
    `foram ABONADAS por deliberação e iniciativa da Diretoria Executiva da ACPROBEC, não restando`,
    `quaisquer pendências ou débitos em aberto relativos a estes lançamentos.`
  ]
  
  textLines.forEach(line => {
    doc.text(line, 20, y)
    y += 6
  })
  
  y += 12
  
  // Table Header
  doc.setFillColor(...GREEN_DARK)
  doc.rect(20, y, 170, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('NOME DO ASSOCIADO', 25, y + 6.5)
  doc.text('CPF', 110, y + 6.5)
  doc.text('MÊS/ANO', 160, y + 6.5)
  
  y += 10
  
  // Table Rows
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  
  // Sort and display
  const items = lancamentosAbonados.map(lanc => {
    const assoc = associados.find(a => a.id === lanc.associado_id)
    return {
      nome: assoc?.nome || 'Associado não identificado',
      cpf: formatCpf(assoc?.cpf || ''),
      mesAno: lanc.data ? lanc.data.substring(0, 7).split('-').reverse().join('/') : '--'
    }
  }).sort((a, b) => a.nome.localeCompare(b.nome))

  items.forEach((item, index) => {
    if (y > 220) { // Add new page if list is too long
      doc.addPage()
      y = 20
    }
    
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252) // slate-50
      doc.rect(20, y, 170, 8, 'F')
    }
    
    doc.setTextColor(...BLACK_TEXT)
    doc.text(item.nome.substring(0, 45), 25, y + 5.5)
    doc.text(item.cpf, 110, y + 5.5)
    doc.text(item.mesAno, 160, y + 5.5)
    y += 8
  })

  y += 15

  // Observação Importante
  if (y > 220) {
    doc.addPage()
    y = 20
  }
  
  doc.setFillColor(243, 244, 246)
  doc.rect(20, y, 170, 22, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...GREEN_DARK)
  doc.text('ATENÇÃO / INFORMAÇÃO DE INICIATIVA', 25, y + 6)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...BLACK_TEXT)
  doc.text('Abono concedido por iniciativa exclusiva da ACPROBEC.', 25, y + 12)
  doc.text('Sem custos ou penalidades para os associados.', 25, y + 17)
  
  y += 45

  if (y > 250) {
    doc.addPage()
    y = 30
  }
  
  // Signatures
  doc.setDrawColor(209, 213, 219)
  doc.setLineWidth(0.5)
  
  doc.line(30, y, 95, y)
  doc.line(115, y, 180, y)
  
  doc.setFontSize(8)
  doc.setTextColor(...GRAY_TEXT)
  doc.text('TESOURARIA', 62.5, y + 4, { align: 'center' })
  doc.text('ACPROBEC', 62.5, y + 8, { align: 'center' })

  doc.text('PRESIDENTE', 147.5, y + 4, { align: 'center' })
  doc.text('ACPROBEC', 147.5, y + 8, { align: 'center' })
  
  // Footer
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    const pageY = 285
    doc.setDrawColor(243, 244, 246)
    doc.line(20, pageY - 5, 190, pageY - 5)
    
    const now = new Date().toLocaleString('pt-BR')
    doc.text(`Recibo emitido em ${now}`, 20, pageY)
    doc.text(`Página ${i} de ${totalPages}`, 190, pageY, { align: 'right' })
  }
  
  if (mode === 'open') {
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  } else if (mode === 'url') {
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    return url
  } else {
    doc.save(`recibo_abono_lote.pdf`)
  }
}
