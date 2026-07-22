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

export async function gerarPdfRecibo(
  associado: any, 
  lancamento: any, 
  recebedorNome: string, 
  mode: 'download' | 'open' | 'url' = 'download',
  logoUrl?: string
): Promise<string | undefined> {
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
  doc.text('RECIBO DE PAGAMENTO', 20, 32)
  
  if (logoUrl) {
    try {
      const response = await fetch(logoUrl)
      const blob = await response.blob()
      const reader = new FileReader()
      await new Promise<void>((resolve) => {
        reader.onload = (e) => {
          const imgData = e.target?.result as string
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            const size = Math.min(img.width, img.height)
            canvas.width = size
            canvas.height = size
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.beginPath()
              ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
              ctx.closePath()
              ctx.clip()
              
              const dx = (size - img.width) / 2
              const dy = (size - img.height) / 2
              ctx.drawImage(img, dx, dy, img.width, img.height)
              
              const roundedImgData = canvas.toDataURL('image/png')
              doc.addImage(roundedImgData, 'PNG', 165, 7.5, 30, 30, undefined, 'FAST')
            } else {
              doc.addImage(imgData, 'JPEG', 165, 7.5, 30, 30, undefined, 'FAST')
            }
            resolve()
          }
          img.onerror = () => resolve()
          img.src = imgData
        }
        reader.readAsDataURL(blob)
      })
    } catch { /* ignore */ }
  }
  
  let y = 60
  
  // Main Declarative Text
  doc.setTextColor(...BLACK_TEXT)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  
  let cleanDesc = (lancamento.descricao || 'Mensalidade').replace(/ \[FIXO\]| \[VARIÁVEL\]| \[PARCIAL\]| \[OBS:.*?\]/g, '')
  cleanDesc = cleanDesc.replace(/^RECEB\. DE /i, '').replace(/^RECEB\./i, '').trim()

  const introText = `Declaramos para os devidos fins que recebemos de ${associado?.nome || '--'}, a importância de ${fmtR(lancamento.valor)}, referente a:`
  const vencimento = lancamento.data ? new Date(lancamento.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : ''
  const itemDesc = `${cleanDesc}${vencimento ? ` (Vencimento: ${vencimento})` : ''}`
  const dataPgto = lancamento.data_caixa || lancamento.data
  const dataPgtoStr = dataPgto ? new Date(dataPgto).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : ''
  const outroText = `Sendo pago em dinheiro na data de ${dataPgtoStr}. Para o qual damos plena, geral e irrevogável quitação.`

  const introLines = doc.splitTextToSize(introText, 170)
  introLines.forEach((line: string) => {
    doc.text(line, 20, y)
    y += 6
  })
  
  y += 2
  doc.setFont('helvetica', 'bold')
  const itemLines = doc.splitTextToSize(itemDesc, 170)
  itemLines.forEach((line: string) => {
    doc.text(line, 20, y)
    y += 6
  })
  
  y += 2
  doc.setFont('helvetica', 'normal')
  const outroLines = doc.splitTextToSize(outroText, 170)
  outroLines.forEach((line: string) => {
    doc.text(line, 20, y)
    y += 6
  })
  
  y += 12
  
  // Section: Dados do Associado
  y = renderSectionTitle(doc, 'Dados do Pagador (Associado)', y)
  const assocData = [
    ['Nome Completo', associado?.nome || '--'],
    ['CPF/CNPJ', formatCpf(associado?.cpf || '')]
  ]
  y = renderGridData(doc, assocData, y)
  
  y += 10
  
  // Section: Detalhes do Lançamento
  y = renderSectionTitle(doc, 'Detalhes do Pagamento', y)
  const lancData = [
    ['Descrição', cleanDesc],
    ['Categoria', lancamento.categoria || 'Mensalidade'],
    ['Valor Pago', fmtR(lancamento.valor)],
    ['Status Final', 'PAGO'],
    ['Data do Pagamento', fmtData(lancamento.data_caixa || lancamento.data)],
    ['Forma de Pagamento', lancamento.forma_pagamento || 'DINHEIRO']
  ]
  y = renderGridData(doc, lancData, y)
  
  y += 15
  
  // Section: Observação Importante
  doc.setFillColor(243, 244, 246) // bg-gray-100
  doc.rect(20, y, 170, 22, 'F')
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...GREEN_DARK)
  doc.text('INFORMAÇÃO DO RECEBEDOR', 25, y + 6)
  
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...BLACK_TEXT)
  doc.text(`Recebido por: ${recebedorNome || '--'}`, 25, y + 12)
  doc.text('Este recibo tem validade como comprovante de pagamento.', 25, y + 17)
  
  y += 45
  
  // Signatures
  doc.setDrawColor(209, 213, 219) // grey line
  doc.setLineWidth(0.5)
  doc.line(65, y, 145, y)
  
  doc.setFontSize(8)
  doc.setTextColor(...GRAY_TEXT)
  doc.text('ACPROBEC', 105, y + 4, { align: 'center' })
  doc.text('ASSOCIAÇÃO COLABORATIVA', 105, y + 8, { align: 'center' })
  
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
    const categoriaStr = (lancamento.categoria || 'MENSALIDADE').toUpperCase()
    const nomeStr = (associado?.nome || 'ASSOCIADO').toUpperCase()
    const parts = (lancamento.data || '').split('-')
    const dataVencStr = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : (lancamento.data || '')
    doc.save(`Recibo - ${categoriaStr} - ${nomeStr} - ${dataVencStr}.pdf`)
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
  
  for (let i = 0; i < data.length; i += 2) {
    const row = data.slice(i, i + 2)
    let maxLines = 1
    
    row.forEach(([label, value], index) => {
      const col = index === 0 ? 20 : 110
      doc.setFont('helvetica', 'bold')
      doc.text(label.toUpperCase(), col, currentY)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(...BLACK_TEXT)
      
      const maxWidth = 80
      const textLines = doc.splitTextToSize(value?.toString() || '--', maxWidth)
      if (textLines.length > maxLines) maxLines = textLines.length
      
      let textY = currentY + 5
      textLines.forEach((line: string) => {
        doc.text(line, col, textY)
        textY += 4.5
      })
      
      doc.setFontSize(8)
      doc.setTextColor(...GRAY_TEXT)
    })
    
    currentY += 10 + (maxLines * 4.5)
  }
  
  return currentY + 5
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
