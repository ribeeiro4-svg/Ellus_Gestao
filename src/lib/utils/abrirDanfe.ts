/**
 * Utilitário compartilhado para abrir o DANFE interno.
 * Funciona idêntico ao visualizarDanfe já existente em ListaNFe.tsx,
 * mas pode ser chamado de qualquer componente cliente com dados pré-carregados.
 */

const fmtR = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const fmtData = (d: string) => {
  try { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') } catch { return d }
}

export function abrirDanfeInterno(nfe: any, itens?: any[]) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const itensHtml = (itens || []).map((i: any) => `
    <tr style="font-size: 8px;">
      <td style="border:1px solid #000;padding:2px">${i.codigo_produto}</td>
      <td style="border:1px solid #000;padding:2px">${i.descricao_produto}</td>
      <td style="border:1px solid #000;padding:2px;text-align:center">${i.ncm || ''}</td>
      <td style="border:1px solid #000;padding:2px;text-align:center">${i.cst_icms || ''}</td>
      <td style="border:1px solid #000;padding:2px;text-align:center">${i.cfop_nfe || ''}</td>
      <td style="border:1px solid #000;padding:2px;text-align:center">${i.unidade_comercial}</td>
      <td style="border:1px solid #000;padding:2px;text-align:right">${Number(i.quantidade).toLocaleString('pt-BR')}</td>
      <td style="border:1px solid #000;padding:2px;text-align:right">${Number(i.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td style="border:1px solid #000;padding:2px;text-align:right">${Number(i.valor_produto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td style="border:1px solid #000;padding:2px;text-align:right">${Number(i.valor_bc_icms || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td style="border:1px solid #000;padding:2px;text-align:right">${Number(i.valor_icms || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td style="border:1px solid #000;padding:2px;text-align:right">${Number(i.aliq_icms || 0).toLocaleString('pt-BR')}%</td>
    </tr>
  `).join('')

  printWindow.document.write(`
    <html>
      <head>
        <title>DANFE - NF ${nfe.numero_nf}</title>
        <style>
          @page { size: A4 portrait; margin: 1cm; }
          body { font-family: 'Arial Narrow', Arial, sans-serif; margin: 0; padding: 0; font-size: 10px; }
          .box { border: 1px solid #000; padding: 2px; position: relative; }
          .label { font-size: 7px; font-weight: bold; text-transform: uppercase; margin-bottom: 1px; display: block; }
          .value { font-size: 10px; font-weight: bold; }
          .grid { display: grid; border-top: 1px solid #000; border-left: 1px solid #000; }
          .grid > div { border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 2px; }
          table { width: 100%; border-collapse: collapse; margin-top: 5px; }
          th { border: 1px solid #000; font-size: 8px; background: #eee; padding: 2px; }
          .barcode { letter-spacing: 2px; font-size: 20px; font-family: 'Libre Barcode 39', cursive; }
        </style>
      </head>
      <body>
        <!-- CABEÇALHO -->
        <div style="display: flex; gap: 5px; margin-bottom: 12px;">
          <div style="flex: 1; border: 1px solid #000; padding: 5px; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 12px; font-weight: bold; text-align: center;">${nfe.nome_emitente || '--'}</div>
            <div style="font-size: 9px; text-align: center; margin-top: 5px;">
              CNPJ: ${nfe.cnpj_emitente || '--'} | UF: ${nfe.uf_emitente || '--'}<br>
              INSCRIÇÃO ESTADUAL: ${nfe.ie_emitente || 'ISENTO'}<br>
              NATUREZA DA OPERAÇÃO: ${nfe.nat_operacao || '--'}
            </div>
          </div>
          <div style="width: 120px; border: 1px solid #000; padding: 5px; text-align: center;">
            <div style="font-size: 14px; font-weight: bold;">DANFE</div>
            <div style="font-size: 8px;">Documento Auxiliar da Nota Fiscal Eletrônica</div>
            <div style="margin: 10px 0; font-size: 11px;">0 - ENTRADA<br>1 - SAÍDA<br><b>${nfe.tp_nf || '1'}</b></div>
            <div style="font-size: 11px; font-weight: bold;">Nº ${nfe.numero_nf}<br>SÉRIE ${nfe.serie || '1'}</div>
          </div>
          <div style="flex: 1.2; border: 1px solid #000; padding: 5px;">
            <div style="text-align: center; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 5px;">
              <div style="background: #000; height: 35px; width: 100%; margin-bottom: 2px;"></div>
              <div style="font-size: 9px; font-weight: bold;">CHAVE DE ACESSO</div>
              <div style="font-size: 10px;">${(nfe.chave_acesso || '--').replace(/(.{4})/g, '$1 ')}</div>
            </div>
            <div style="text-align: center; font-size: 9px;">
              Consulta de autenticidade no portal nacional da NF-e<br>
              www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora
            </div>
          </div>
        </div>

        <div style="border: 1px solid #000; padding: 4px; font-size: 10px; margin-bottom: 12px; display: flex; justify-content: space-between;">
          <span><b>PROTOCOLO DE AUTORIZAÇÃO DE USO:</b> ${nfe.protocolo || '--'}</span>
          <span><b>CNPJ:</b> ${nfe.cnpj_emitente || '--'}</span>
        </div>

        <div style="margin-bottom: 12px;">
          <div style="background: #eee; border: 1px solid #000; font-size: 8px; font-weight: bold; padding: 2px;">DESTINATÁRIO / REMETENTE</div>
          <div class="grid" style="grid-template-columns: 3fr 1fr 1fr;">
            <div><span class="label">NOME / RAZÃO SOCIAL</span><span class="value">${nfe.nome_destinatario || '--'}</span></div>
            <div><span class="label">CNPJ/CPF</span><span class="value">${nfe.cnpj_destinatario || '--'}</span></div>
            <div><span class="label">DATA EMISSÃO</span><span class="value">${fmtData(nfe.data_emissao)}</span></div>
            <div><span class="label">ENDEREÇO</span><span class="value">--</span></div>
            <div><span class="label">UF</span><span class="value">--</span></div>
            <div><span class="label">DATA SAÍDA/ENTRADA</span><span class="value">${fmtData(nfe.data_entrada)}</span></div>
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <div style="background: #eee; border: 1px solid #000; font-size: 8px; font-weight: bold; padding: 2px;">CÁLCULO DO IMPOSTO</div>
          <div class="grid" style="grid-template-columns: repeat(5, 1fr);">
            <div><span class="label">BASE CÁLC. ICMS</span><span class="value">${fmtR(nfe.valor_icms > 0 ? nfe.valor_produtos : 0)}</span></div>
            <div><span class="label">VALOR DO ICMS</span><span class="value">${fmtR(nfe.valor_icms)}</span></div>
            <div><span class="label">BASE CÁLC. ICMS ST</span><span class="value">R$ 0,00</span></div>
            <div><span class="label">VALOR DO ICMS ST</span><span class="value">R$ 0,00</span></div>
            <div><span class="label">VALOR TOTAL DOS PRODUTOS</span><span class="value">${fmtR(nfe.valor_produtos)}</span></div>
            <div><span class="label">VALOR DO FRETE</span><span class="value">${fmtR(nfe.valor_frete)}</span></div>
            <div><span class="label">VALOR DO SEGURO</span><span class="value">${fmtR(nfe.valor_seguro)}</span></div>
            <div><span class="label">DESCONTO</span><span class="value">${fmtR(nfe.valor_desconto)}</span></div>
            <div><span class="label">OUTRAS DESPESAS</span><span class="value">R$ 0,00</span></div>
            <div><span class="label">VALOR TOTAL DA NOTA</span><span class="value" style="font-size:12px">${fmtR(nfe.valor_total)}</span></div>
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <div style="background: #eee; border: 1px solid #000; font-size: 8px; font-weight: bold; padding: 2px;">DADOS DOS PRODUTOS / SERVIÇOS</div>
          <table>
            <thead>
              <tr>
                <th>CÓD. PROD.</th>
                <th>DESCRIÇÃO DOS PRODUTOS / SERVIÇOS</th>
                <th>NCM/SH</th>
                <th>CST</th>
                <th>CFOP</th>
                <th>UN</th>
                <th>QTD</th>
                <th>V. UNIT</th>
                <th>V. TOTAL</th>
                <th>BC ICMS</th>
                <th>V. ICMS</th>
                <th>% ICMS</th>
              </tr>
            </thead>
            <tbody>${itensHtml}</tbody>
          </table>
        </div>

        <div style="margin-top: 10px;">
          <div style="background: #eee; border: 1px solid #000; font-size: 8px; font-weight: bold; padding: 2px;">DADOS ADICIONAIS</div>
          <div style="border: 1px solid #000; padding: 5px; height: 60px; font-size: 8px;">
            <b>INFORMAÇÕES COMPLEMENTARES:</b><br>
            ${nfe.inf_complementar || 'Nenhuma informação adicional.'}
          </div>
        </div>

        <script>window.print();</script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

export function abrirDanfseInterno(nfse: any) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const retencoesHtml = `
    <div class="grid" style="grid-template-columns: repeat(5, 1fr); margin-top: 5px;">
      <div><span class="label">PIS</span><span class="value">${fmtR(nfse.valor_pis)}</span></div>
      <div><span class="label">COFINS</span><span class="value">${fmtR(nfse.valor_cofins)}</span></div>
      <div><span class="label">CSLL</span><span class="value">${fmtR(nfse.valor_csll)}</span></div>
      <div><span class="label">IRRF</span><span class="value">${fmtR(nfse.valor_irrf)}</span></div>
      <div><span class="label">ISS RETIDO</span><span class="value">${nfse.iss_retido ? 'SIM' : 'NÃO'}</span></div>
    </div>
  `

  printWindow.document.write(`
    <html>
      <head>
        <title>DANFSE - NFS-e ${nfse.numero_nfse}</title>
        <style>
          @page { size: A4 portrait; margin: 1cm; }
          body { font-family: 'Arial Narrow', Arial, sans-serif; margin: 0; padding: 0; font-size: 10px; color: #333; }
          .box { border: 1px solid #000; padding: 5px; margin-bottom: 5px; }
          .label { font-size: 7px; font-weight: bold; text-transform: uppercase; color: #666; display: block; margin-bottom: 2px; }
          .value { font-size: 10px; font-weight: bold; color: #000; }
          .grid { display: grid; border-top: 1px solid #000; border-left: 1px solid #000; }
          .grid > div { border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 4px; }
          .header { display: flex; gap: 5px; margin-bottom: 10px; }
          .title { font-size: 14px; font-weight: bold; text-align: center; }
          .subtitle { font-size: 9px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="flex: 2; border: 1px solid #000; padding: 10px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <div class="title">${nfse.prestador_nome || nfse.prestador?.nome || 'PRESTADOR DE SERVIÇOS'}</div>
            <div class="subtitle">CNPJ: ${nfse.prestador_cnpj || nfse.prestador?.cpf_cnpj || '--'}</div>
          </div>
          <div style="flex: 1; border: 1px solid #000; padding: 10px; text-align: center;">
            <div class="title">DANFSE</div>
            <div class="subtitle">Documento Auxiliar da Nota Fiscal de Serviço Eletrônica</div>
            <div style="margin-top: 10px; font-size: 12px; font-weight: bold;">Nº ${nfse.numero_nfse}</div>
          </div>
        </div>

        <div class="box">
          <div class="label">Chave de Acesso / Código de Verificação</div>
          <div class="value" style="font-size: 12px; letter-spacing: 1px;">${nfse.chave_nacional || nfse.codigo_verificacao || '--'}</div>
        </div>

        <div style="margin-bottom: 10px;">
          <div style="background: #eee; border: 1px solid #000; font-size: 8px; font-weight: bold; padding: 3px;">TOMADOR DO SERVIÇO</div>
          <div class="grid" style="grid-template-columns: 2fr 1fr 1fr;">
            <div><span class="label">NOME / RAZÃO SOCIAL</span><span class="value">${nfse.tomador_nome || 'CONSUMIDOR FINAL'}</span></div>
            <div><span class="label">CNPJ/CPF</span><span class="value">${nfse.tomador_cnpj || '--'}</span></div>
            <div><span class="label">DATA EMISSÃO</span><span class="value">${fmtData(nfse.data_emissao)}</span></div>
          </div>
        </div>

        <div style="margin-bottom: 10px;">
          <div style="background: #eee; border: 1px solid #000; font-size: 8px; font-weight: bold; padding: 3px;">DESCRIÇÃO DOS SERVIÇOS</div>
          <div style="border: 1px solid #000; padding: 10px; min-height: 250px; font-size: 11px; line-height: 1.4; white-space: pre-wrap;">
            ${nfse.descricao_servico || 'Serviços Prestados.'}
          </div>
        </div>

        <div style="margin-bottom: 10px;">
          <div style="background: #eee; border: 1px solid #000; font-size: 8px; font-weight: bold; padding: 3px;">VALORES E RETENÇÕES</div>
          <div class="grid" style="grid-template-columns: repeat(4, 1fr);">
            <div><span class="label">VALOR BRUTO</span><span class="value">${fmtR(nfse.valor_bruto)}</span></div>
            <div><span class="label">VALOR ISS</span><span class="value">${fmtR(nfse.valor_iss)}</span></div>
            <div><span class="label">OUTRAS RETENÇÕES</span><span class="value">${fmtR((nfse.valor_pis || 0) + (nfse.valor_cofins || 0) + (nfse.valor_csll || 0) + (nfse.valor_irrf || 0))}</span></div>
            <div><span class="label">VALOR LÍQUIDO</span><span class="value" style="font-size: 14px;">${fmtR(nfse.valor_liquido || nfse.valor_bruto)}</span></div>
          </div>
          ${retencoesHtml}
        </div>

        <div style="border: 1px solid #000; padding: 5px; font-size: 8px; color: #666; text-align: center;">
          Este documento é uma representação auxiliar de uma NFS-e. A autenticidade pode ser verificada no portal da prefeitura correspondente.
        </div>

        <script>window.print();</script>
      </body>
    </html>
  `)
  printWindow.document.close()
}
