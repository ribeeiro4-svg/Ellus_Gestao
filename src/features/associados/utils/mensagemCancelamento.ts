// Mensagem de cancelamento para WhatsApp
export interface PendenciaItem {
  descricao: string
  valor: number
  data: string
  tipo: 'atrasado' | 'vincendo'
}

export function getMensagemCancelamento(
  nomeAssociado: string,
  pendencias?: { itens: PendenciaItem[]; total: number }
): string {
  const fmtR = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  const fmtDate = (d: string) => {
    if (!d) return ''
    const p = d.split('-')
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d
  }

  let blocoPendencias = ''
  if (pendencias && pendencias.itens.length > 0) {
    const linhasItens = pendencias.itens
      .map(
        (item) =>
          `  • ${item.descricao} — *${fmtR(item.valor)}*` +
          (item.data ? ` (venc. ${fmtDate(item.data)})` : '') +
          (item.tipo === 'atrasado' ? ' ⚠️ ATRASADO' : '')
      )
      .join('\n')

    blocoPendencias =
      '\n' +
      '⚠️ *PENDÊNCIAS FINANCEIRAS EM ABERTO:*\n' +
      linhasItens + '\n' +
      '\n' +
      `*TOTAL: ${fmtR(pendencias.total)}*\n` +
      '\n' +
      '❗ *Para que o cancelamento seja efetivado, é necessário quitar todas as pendências financeiras acima.*\n'
  }

  return (
    `Olá, ${nomeAssociado}. Tudo bem? 😊` + '\n' +
    '\n' +
    `Recebemos sua solicitação de cancelamento do vínculo associativo e do plano HGU!` + '\n' +
    blocoPendencias +
    '\n' +
    `*Para prosseguirmos com o cancelamento é solicitado a assinatura do termo de desistência através do link abaixo:*` + '\n' +
    '\n' +
    '\n' +
    `🔗 *CLIQUE ABAIXO PARA ASSINAR O TERMO DE DESISTÊNCIA ACPROBEC E HGU SAÚDE*` + '\n' +
    '\n' +
    `Pedimos que leia o termo com atenção e quaisquer dúvidas, nos questione antes da assinatura do mesmo:` + '\n' +
    '\n' +
    `https://app.zapsign.com.br/verificar/doc/3392e99c-f414-467d-9edb-17ecbb732916` + '\n' +
    '\n' +
    `*Att*` + '\n' +
    `DIRETORIA & SECRETARIA - ACPROBEC`
  )
}
