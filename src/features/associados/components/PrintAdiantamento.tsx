import { Adiantamento } from '@/lib/types'
import { Diretor } from '@/lib/hooks/useDiretoria'
import { fmtR } from '@/lib/utils/formatters'

const htmlBase = (titulo: string, content: string, logoUrl?: string) => `
<html>
  <head>
    <title>${titulo}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
      body { font-family: 'Inter', sans-serif; padding: 0; margin: 0; color: #1e293b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: A4 portrait; margin: 10mm; }
      .container { width: 100%; max-width: 800px; margin: 0 auto; }
      .header { background-color: #0e2d22; color: white; padding: 40px; display: flex; align-items: center; justify-content: space-between; border-bottom: 6px solid #10b981; }
      .header-text { text-align: left; }
      .header-text p { margin: 0; font-size: 14px; font-weight: bold; letter-spacing: 1px; opacity: 0.9; text-transform: uppercase; margin-bottom: 5px; }
      .header-text h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
      .header-logo { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; background-color: #fdfaf6; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
      .footer-logo { height: 40px; margin-bottom: 10px; opacity: 0.8; }
      .content { padding: 40px 30px; }
      .section-title { font-size: 14px; text-transform: uppercase; color: #064e3b; border-bottom: 2px solid #10b981; padding-bottom: 5px; margin-bottom: 20px; font-weight: 900; }
      .row { display: flex; margin-bottom: 15px; }
      .label { font-weight: bold; width: 150px; color: #64748b; font-size: 12px; text-transform: uppercase; }
      .value { flex: 1; font-size: 14px; font-weight: 700; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px; }
      .signatures { margin-top: 80px; display: flex; justify-content: space-around; text-align: center; }
      .sig-line { border-top: 1px solid #1e293b; width: 220px; padding-top: 5px; font-weight: bold; font-size: 11px; white-space: nowrap; }
      .sig-title { font-size: 10px; color: #64748b; text-transform: uppercase; }
      .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; }
      .highlight { color: #064e3b; font-size: 18px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="header-text">
          <p>ACPROBEC — ASSOCIAÇÃO COLABORATIVA</p>
          <h1>${titulo}</h1>
        </div>
        ${logoUrl ? `<img src="${logoUrl}" class="header-logo" onerror="this.style.display='none'" />` : ''}
      </div>
      <div class="content">
        ${content}
        <div class="footer">
          <img src="/ellus_logo_v2.svg" class="footer-logo" onerror="this.style.display='none'" /><br/>
          Documento gerado eletronicamente em ${new Date().toLocaleString('pt-BR')} pelo Sistema Éllus Gestão Estratégica
        </div>
      </div>
    </div>
  </body>
</html>
`

export function ImprimirGuia(item: Adiantamento, diretor?: Diretor, logoUrl?: string) {
  const tituloGuia = item.tipo === 'EMPRESTIMO' ? 'SOLICITAÇÃO DE EMPRÉSTIMO' : 'SOLICITAÇÃO DE ADIANTAMENTO'
  const content = `
    <h2 class="section-title">${tituloGuia} - Nº ${String(item.numero || 0).padStart(4, '0')}</h2>
    
    <div class="row">
      <div class="label">Diretor(a)</div>
      <div class="value">${diretor?.nome || item.diretor_nome || '-'}</div>
    </div>
    <div class="row">
      <div class="label">Cargo</div>
      <div class="value">${(diretor?.cargo || '-').replace(' [ISENTO INSS]', '').replace('[ISENTO INSS]', '').trim()}</div>
    </div>
    <div class="row">
      <div class="label">CPF</div>
      <div class="value">${diretor?.cpf || '-'}</div>
    </div>
    <div class="row">
      <div class="label">Tipo</div>
      <div class="value">${item.tipo}</div>
    </div>
    <div class="row">
      <div class="label">Valor Solicitado</div>
      <div class="value highlight">${fmtR(item.valor)}</div>
    </div>
    <div class="row">
      <div class="label">Parcelas</div>
      <div class="value">${item.parcelas}x</div>
    </div>
    <div class="row">
      <div class="label">Motivo</div>
      <div class="value">${item.motivo || '-'}</div>
    </div>
    <div class="row">
      <div class="label">Data de Solicitação</div>
      <div class="value">${new Date(item.data_solicitacao).toLocaleDateString('pt-BR')}</div>
    </div>
    ${['APROVADO', 'PAGO', 'DESCONTADO'].includes(item.status) ? `
    <div style="margin-top: 20px; padding: 15px; border: 2px solid #064e3b; background-color: #f8fafc; border-radius: 8px;">
      <div class="row" style="margin-bottom: 10px;">
        <div class="label" style="color: #064e3b; width: 180px;">Data de Aprovação</div>
        <div class="value" style="color: #064e3b; font-weight: 900;">${item.data_aprovacao ? new Date(item.data_aprovacao).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</div>
      </div>
      <div class="row" style="margin-bottom: 0;">
        <div class="label highlight" style="width: 180px;">Data de Pagamento</div>
        <div class="value highlight">${item.data_pagamento ? new Date(item.data_pagamento).toLocaleDateString('pt-BR') : '____ / ____ / ________'}</div>
      </div>
    </div>
    ` : ''}

    <div class="signatures">
      <div>
        <div class="sig-line">${diretor?.nome || 'Diretor Solicitante'}</div>
        <div class="sig-title">Assinatura do Diretor</div>
      </div>
      <div>
        <div class="sig-line">Presidência</div>
        <div class="sig-title">Aprovação</div>
      </div>
      <div>
        <div class="sig-line">Tesouraria</div>
        <div class="sig-title">Aprovação</div>
      </div>
    </div>
  `

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(htmlBase(tituloGuia, content, logoUrl))
    win.document.close()
    setTimeout(() => {
      win.print()
    }, 500)
  }
}

export function ImprimirRecibo(item: Adiantamento, diretor?: Diretor, logoUrl?: string) {
  const content = `
    <h2 class="section-title">RECIBO - Nº ${String(item.numero || 0).padStart(4, '0')}</h2>
    
    <div style="font-size: 16px; line-height: 2; text-align: justify; margin: 40px 0;">
      <p>
      Recebi da <strong>ACPROBEC - Associação Colaborativa de Profissionais Liberais, Comércio e Setor da Beleza</strong>, 
      a importância de <strong>R$ ${Number(item.valor).toFixed(2).replace('.', ',')}</strong>, <strong>${item.tipo}</strong>, 
      a ser descontado em ${item.parcelas} parcela(s).
    </div>

    <div class="row">
      <div class="label">Forma de pagamento</div>
      <div class="value">${item.forma_pagamento || 'Conta Bancária / PIX'}</div>
    </div>
    <div class="row">
      <div class="label">Data de Pagamento</div>
      <div class="value">${item.data_pagamento ? new Date(item.data_pagamento).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</div>
    </div>

    <div class="signatures">
      <div>
        <div class="sig-line">${diretor?.nome || 'Assinatura'}</div>
        <div class="sig-title">${diretor?.cpf ? 'CPF: ' + diretor.cpf : 'Recebedor'}</div>
      </div>
    </div>
  `

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(htmlBase('RECIBO DE PAGAMENTO', content, logoUrl))
    win.document.close()
    setTimeout(() => {
      win.print()
    }, 500)
  }
}
