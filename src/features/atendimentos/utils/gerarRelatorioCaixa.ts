import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const gerarFechamentoCaixaPdf = (dataFechamento: string, lancamentos: any[], saldoDia: number) => {
  const doc = new jsPDF()
  
  // Helpers para formatação
  const fmtDateBr = (dateStr: string) => {
    if (!dateStr) return '--'
    const parts = dateStr.split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
    return dateStr
  }
  
  const fmtR = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  // Cabeçalho
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(33, 37, 41)
  doc.text('Relatório de Fechamento de Caixa', 14, 20)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Data do Fechamento: ${fmtDateBr(dataFechamento)}`, 14, 28)
  doc.text(`Emitido em: ${new Date().toLocaleString('pt-BR')}`, 14, 33)

  // Tabela de Lançamentos
  const tableData = lancamentos.map(l => [
    l.associado?.nome || l.associado_nome || '--',
    l.descricao || '--',
    fmtR(l.valor || 0)
  ])

  ;(doc as any).autoTable({
    startY: 40,
    head: [['Associado', 'Descrição', 'Valor (R$)']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' }, // emerald-500
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 40, halign: 'right' }
    }
  })

  // Totalizador
  const finalY = (doc as any).lastAutoTable.finalY || 40
  
  doc.setFillColor(236, 253, 245) // emerald-50
  doc.rect(14, finalY + 10, 182, 15, 'F')
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(4, 120, 87) // emerald-700
  doc.text('SALDO TOTAL DO DIA (ESPÉCIE):', 20, finalY + 20)
  doc.text(fmtR(saldoDia), 140, finalY + 20, { align: 'right' })

  // Assinatura
  doc.setDrawColor(200, 200, 200)
  doc.line(60, finalY + 60, 150, finalY + 60)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text('Assinatura do Responsável pelo Caixa', 105, finalY + 65, { align: 'center' })

  doc.save(`Fechamento_Caixa_${dataFechamento}.pdf`)
}
