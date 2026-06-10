import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const GREEN_PRIMARY = [29, 158, 117] as const // #1D9E75
const GRAY_TEXT = [100, 116, 139] as const
const BLACK_TEXT = [30, 41, 59] as const

function renderHeader(doc: jsPDF, title: string, name: string) {
  doc.setFillColor(...GREEN_PRIMARY)
  doc.rect(0, 0, 210, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('ACPROBEC — GESTÃO INTELIGENTE', 20, 15)
  
  doc.setFontSize(16)
  doc.text(title, 20, 28)
  
  doc.setFontSize(10)
  doc.text(name.toUpperCase(), 190, 28, { align: 'right' })
}

function renderSignatures(doc: jsPDF, y: number, name: string) {
  doc.setDrawColor(...GRAY_TEXT)
  doc.line(30, y, 90, y)
  doc.line(120, y, 180, y)
  
  doc.setFontSize(8)
  doc.setTextColor(...BLACK_TEXT)
  doc.setFont('helvetica', 'normal')
  
  doc.text(name.toUpperCase(), 60, y + 5, { align: 'center' })
  doc.text('ASSOCIADO', 60, y + 10, { align: 'center' })
  
  doc.text('ACPROBEC', 150, y + 5, { align: 'center' })
  doc.text('ASSOCIAÇÃO', 150, y + 10, { align: 'center' })
}

export const gerarFichaAtendimentoPdf = (associado: any, atendimento: any, dadosAlteradosNoCadastro: string[] = []) => {
  const doc = new jsPDF()

  // Via 1 (ACPROBEC)
  renderViaFicha(doc, 'VIA 1 - ACPROBEC', associado, atendimento, dadosAlteradosNoCadastro)
  
  doc.addPage()
  
  // Via 2 (Associado)
  renderViaFicha(doc, 'VIA 2 - ASSOCIADO', associado, atendimento, dadosAlteradosNoCadastro)

  doc.save(`Ficha_Atendimento_${associado.nome.replace(/\s+/g, '_')}.pdf`)
}

function renderViaFicha(doc: jsPDF, viaInfo: string, associado: any, atendimento: any, dadosAlteradosNoCadastro: string[] = []) {
  renderHeader(doc, 'Registro Formal de Atendimento', associado.nome)

  let y = 50
  
  doc.setFontSize(8)
  doc.setTextColor(...GRAY_TEXT)
  doc.text(viaInfo, 20, y)
  y += 10

  const allDocsOk = !atendimento.etapas_concluidas?.falta_docs
  const docsText = allDocsOk ? 'OK ✅' : 'PENDENTE (Faltam documentos) ❌'

  const isTitular = atendimento.etapas_concluidas?.isTitular !== false
  const nomeTitularPlano = atendimento.etapas_concluidas?.nomeTitular || ''
  const grauParentesco = atendimento.etapas_concluidas?.grauParentescoTitular || ''
  const titularText = isTitular 
    ? 'PRÓPRIO TITULAR BENEFICIÁRIO' 
    : `TERCEIRO — ${nomeTitularPlano || 'Nome não informado'} (${grauParentesco || 'Parentesco não informado'})`

  const data = [
    ['ASSOCIADO:', associado.nome],
    ['TITULAR DO PLANO:', titularText],
    ['TERMO ADESÃO:', atendimento.etapas_concluidas?.termo_zapsign ? 'ASSINADO ✅' : 'PENDENTE ❌'],
    ['PAGAMENTO ADESÃO:', atendimento.etapas_concluidas?.adesao_paga ? 'EFETUADO ✅' : 'PENDENTE ❌'],
    ['DECLARAÇÃO SAÚDE HGU:', atendimento.etapas_concluidas?.declaracao_saude ? 'PREENCHIDA ✅' : 'PENDENTE ❌'],
    ['DOCUMENTOS:', docsText]
  ]

  doc.setFontSize(9)
  data.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BLACK_TEXT)
    doc.text(label, 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 80, y)
    y += 7
  })

  y += 5
  const formatedDate = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  const diaVenc = associado.vencimento_dia || 10
  
  const detalhes = [
    ['ATENDIMENTO:', `${formatedDate}`],
    ['RESPONSÁVEL PELO ATENDIMENTO:', atendimento.responsavel_nome || atendimento.responsavel_setor || '--'],
    ['CORRETOR(A) RESPONSÁVEL:', atendimento.corretor_nome || '--'],
    ['PREVISÃO INCLUSÃO HGU:', atendimento.previsao_inclusao_hgu || '--'],
    ['PAGAMENTO TAXA ADESÃO:', atendimento.pagamento_adesao_forma || '--'],
    ['VENCIMENTO MENSALIDADE:', `DIA ${diaVenc}`]
  ]

  detalhes.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 80, y)
    y += 7
  })

  if (atendimento.etapas_concluidas?.hasSituacaoEspecialSaude && atendimento.etapas_concluidas?.textoSituacaoEspecialSaude) {
    y += 5
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BLACK_TEXT)
    doc.text('SITUAÇÃO ESPECIAL (DECLARAÇÃO SAÚDE):', 20, y)
    
    doc.setFont('helvetica', 'normal')
    const saudeLines = doc.splitTextToSize(atendimento.etapas_concluidas.textoSituacaoEspecialSaude, 170)
    doc.text(saudeLines, 20, y + 5)
    y += 5 + (saudeLines.length * 5)
  }

  if (atendimento.etapas_concluidas?.observacao) {
    y += 10
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BLACK_TEXT)
    doc.text('OBSERVAÇÃO:', 20, y)
    
    doc.setFont('helvetica', 'normal')
    const obsLines = doc.splitTextToSize(atendimento.etapas_concluidas.observacao, 140)
    doc.text(obsLines, 50, y)
    y += (obsLines.length * 4)
  }

  y += 10
  doc.setFontSize(8)
  doc.setTextColor(...GREEN_PRIMARY)
  doc.text('Ao precisar de suporte ou tirar dúvidas, basta nos contatar: 87 98125 6590. 😊', 20, y)

  renderSignatures(doc, y + 25, associado.nome)
}

export const gerarTermoCienciaPdf = (associado: any, atendimento: any) => {
  const doc = new jsPDF()

  // Via 1
  renderViaTermo(doc, 'VIA 1 - ACPROBEC', associado, atendimento)
  
  doc.addPage()
  
  // Via 2
  renderViaTermo(doc, 'VIA 2 - ASSOCIADO', associado, atendimento)

  doc.save(`Termo_Ciencia_${associado.nome.replace(/\s+/g, '_')}.pdf`)
}

function renderViaTermo(doc: jsPDF, viaInfo: string, associado: any, atendimento: any) {
  renderHeader(doc, 'Termo de Ciência - Pendência de Documentos', associado.nome)

  let y = 50
  
  doc.setFontSize(8)
  doc.setTextColor(...GRAY_TEXT)
  doc.text(viaInfo, 20, y)
  y += 10

  doc.setFontSize(9)
  doc.setTextColor(...BLACK_TEXT)
  doc.setFont('helvetica', 'normal')

  const formatedDate = new Date().toLocaleString('pt-BR')
  
  let faltantes: string[] = []
  if (atendimento.etapas_concluidas?.docs_faltantes) {
    faltantes = atendimento.etapas_concluidas.docs_faltantes
  }

  const lines = doc.splitTextToSize(`Declaro para os devidos fins que, no atendimento realizado na data de ${formatedDate}, foram entregues parte dos documentos necessários para adesão ao plano HGU.`, 170)
  doc.text(lines, 20, y)
  y += 10

  doc.setFont('helvetica', 'bold')
  doc.text('Ficou faltando somente o envio dos seguintes documentos:', 20, y)
  y += 6
  
  doc.setFont('helvetica', 'normal')
  faltantes.forEach(f => {
    doc.text(`- ${f}`, 25, y)
    y += 5
  })
  
  y += 5
  const aviso = doc.splitTextToSize(`O associado(a) ${associado.nome.toUpperCase()} (CPF: ${associado.cpf || '--'}) tem plena ciência de que sua documentação só será encaminhada ao HGU para ativação no dia seguinte após a entrega dos documentos faltantes. O prazo para ativação começará a contar apenas a partir deste envio.`, 170)
  doc.text(aviso, 20, y)

  y += 15
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(220, 38, 38) // red-600
  doc.text('IMPORTANTE:', 20, y)
  doc.setTextColor(...BLACK_TEXT)
  doc.setFont('helvetica', 'normal')
  doc.text('Pode mandar em imagem ou PDF via WhatsApp: 87 98125 6590.', 45, y)

  renderSignatures(doc, y + 25, associado.nome)
}

export const gerarRelatorioAtendimentosPdf = (atendimentos: any[], dataInicio: string, dataFim: string, responsaveis: any[] = []) => {
  const doc = new jsPDF('portrait', 'mm', 'a4') // Vertical A4
  doc.setFillColor(...GREEN_PRIMARY)
  doc.rect(0, 0, 210, 30, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('ACPROBEC — GESTÃO INTELIGENTE', 14, 12)
  
  doc.setFontSize(16)
  doc.text('Relatório de Atendimentos Presenciais', 14, 22)
  
  const inicioBr = dataInicio.split('-').reverse().join('/')
  const fimBr = dataFim.split('-').reverse().join('/')
  doc.setFontSize(10)
  doc.text(`Período: ${inicioBr} a ${fimBr}`, 280, 22, { align: 'right' })

  const tableData = atendimentos.map(a => {
    const associado = a.associados || {}
    const dependentes = Array.isArray(a.dependentes) ? a.dependentes.map((d: any) => d.nome || 'Dependente').join(', ') : ''
    
    let docsOkText = 'Pendente'
    if (a.etapas_concluidas?.falta_docs === false) docsOkText = 'OK'
    else if (a.status === 'concluido') docsOkText = 'OK'

    const d = new Date(a.data_agendamento)
    const dataPreenchimento = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`

    let enviadoHguText = '--'
    if (a.etapas_concluidas?.enviado_hgu_em) {
      enviadoHguText = new Date(`${a.etapas_concluidas.enviado_hgu_em}T12:00:00`).toLocaleDateString('pt-BR')
    }

    const isTitular = a.etapas_concluidas?.isTitular !== false
    const nomeTitular = isTitular ? associado.nome : (a.etapas_concluidas?.nomeTitular || '--')
    const nomeAssociado = isTitular ? 'O PRÓPRIO' : (associado.nome || '--')

    // Abbreviate status to prevent line wraps
    let statusText = '--'
    if (a.status) {
      const statusMap: Record<string, string> = {
        'agendado': 'AGENDADO',
        'em_andamento': 'ANDAMENTO',
        'concluido': 'CONCLUIDO',
        'cancelado': 'CANCELADO',
        'falta_documento': 'FALTA DOC'
      }
      statusText = statusMap[a.status] || a.status.toUpperCase()
    }
    // Also check status field for falta_documento-like values
    if (a.status?.toLowerCase().includes('falta')) statusText = 'FALTA DOC'

    // Find responsavel
    const nomeVendedor = responsaveis.find((r: any) => r.id === a.responsavel_id)?.nome || '--'
    const nomeCorretor = responsaveis.find((r: any) => r.id === a.etapas_concluidas?.corretor_id)?.nome || '--'

    return [
      String(nomeTitular || '--').toUpperCase(),
      String(dependentes || '--').toUpperCase(),
      String(nomeAssociado).toUpperCase(),
      String(a.etapas_concluidas?.tipo || '--').toUpperCase(),
      String(a.etapas_concluidas?.faixa_etaria || '--').toUpperCase(),
      String(a.etapas_concluidas?.tabela || '--').toUpperCase(),
      String(a.etapas_concluidas?.valor_mensal || '--').toUpperCase(),
      String(statusText).toUpperCase(),
      String(docsOkText).toUpperCase(),
      dataPreenchimento,
      String(nomeVendedor).toUpperCase(),
      String(nomeCorretor).toUpperCase()
    ]
  })

  autoTable(doc, {
    startY: 35,
    head: [['TITULAR DO PLANO', 'DEPEND.', 'ASSOC.', 'TIPO', 'FX. ET.', 'TABELA', 'VALOR', 'STATUS', 'DOCUMENTOS', 'DATA', 'RESP. ATEND.', 'CORRETOR']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [...GREEN_PRIMARY], textColor: 255, fontStyle: 'bold', fontSize: 6 },
    bodyStyles: { fontSize: 5.5, textColor: [...BLACK_TEXT], cellPadding: 1.5 },
    styles: { overflow: 'ellipsize' },
    didDrawPage: function (data) {
      doc.setFontSize(8)
      doc.setTextColor(...GRAY_TEXT)
      doc.text(`Página ${(doc as any).internal.getNumberOfPages()}`, 196, doc.internal.pageSize.getHeight() - 10, { align: 'right' })
    }
  })

  // Signatures section at the end
  let finalY = (doc as any).lastAutoTable.finalY + 20
  
  if (finalY > doc.internal.pageSize.getHeight() - 50) {
    doc.addPage()
    finalY = 30
  }

  doc.setFontSize(10)
  doc.setTextColor(...BLACK_TEXT)
  doc.setFont('helvetica', 'normal')
  doc.text(
    'As assinaturas confirmam que todos os processos foram conferidos e que todas as informações contidas neste relatório estão de acordo.',
    105,
    finalY,
    { align: 'center', maxWidth: 190 }
  )

  finalY += 15 // Aumentei de 10 para 15 para compensar possível quebra de linha
  doc.text(`Enviado por Leandro Xavier em:   ${fimBr}`, 105, finalY, { align: 'center' })

  finalY += 30

  // 3 Assinaturas na horizontal - Ajustadas para retrato (210mm)
  doc.setDrawColor(...GRAY_TEXT)
  
  // Fonte um pouco menor para caber em retrato
  doc.setFontSize(8)

  // Assinatura 1
  doc.line(15, finalY, 70, finalY)
  doc.text('Responsável Atendimentos ACPROBEC', 42.5, finalY + 5, { align: 'center' })
  
  // Assinatura 2
  doc.line(77.5, finalY, 132.5, finalY)
  doc.text('Leandro Xavier', 105, finalY + 5, { align: 'center' })
  
  // Assinatura 3
  doc.line(140, finalY, 195, finalY)
  doc.text('Responsável Recebimento HGU', 167.5, finalY + 5, { align: 'center' })

  doc.save(`Relatorio_Atendimentos_${dataInicio}_ate_${dataFim}.pdf`)
}
