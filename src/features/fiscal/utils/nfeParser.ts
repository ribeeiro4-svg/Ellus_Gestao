// Parser de XML NF-e (Modelo 55) — usa DOMParser nativo do browser
// Conforme MOC NF-e v4.0.1 e Ajuste SINIEF 07/2005

export interface NFeParsed {
  // Identificação
  chaveAcesso: string
  numeroNF: string
  serie: string
  dataEmissao: string
  dataEntrada: string
  natOperacao: string
  modelo: string
  tpNF: string // 0=entrada, 1=saída
  // Emitente
  cnpjEmitente: string
  nomeEmitente: string
  fantEmitente: string
  ufEmitente: string
  crtEmitente: string // 1=Simples, 2=Simples Excesso, 3=Normal
  ieEmitente: string
  // Destinatário
  cnpjDestinatario: string
  nomeDestinatario: string
  // Totais
  valorProdutos: number
  valorFrete: number
  valorSeguro: number
  valorDesconto: number
  valorIPI: number
  valorPIS: number
  valorCOFINS: number
  valorICMS: number
  valorTotal: number
  valorTotTrib: number
  // Transporte
  modFrete: string
  // Cobrança
  duplicatas: { numero: string; vencimento: string; valor: number }[]
  // Informações adicionais
  infComplementar: string
  infAdFisco: string
  // Itens
  itens: NFeItem[]
  // Raw XML
  xmlRaw: string
  // Validação
  valido: boolean
  erros: string[]
}

export interface NFeItem {
  nItem: number
  cProd: string
  cEAN: string
  xProd: string
  NCM: string
  CEST: string
  CFOP: string
  uCom: string
  qCom: number
  vUnCom: number
  vProd: number
  vFrete: number
  vSeg: number
  vDesc: number
  vOutro: number
  // ICMS
  origICMS: string
  CSTICMS: string
  modBCICMS: string
  vBCICMS: number
  pICMS: number
  vICMS: number
  vBCST: number
  pICMSST: number
  vICMSST: number
  // IPI
  CSTIPI: string
  vBCIPI: number
  pIPI: number
  vIPI: number
  // PIS
  CSTPIS: string
  vBCPIS: number
  pPIS: number
  vPIS: number
  // COFINS
  CSTCOFINS: string
  vBCCOFINS: number
  pCOFINS: number
  vCOFINS: number
}

function getText(el: Element | null | undefined, tag: string, ns = ''): string {
  if (!el) return ''
  const found = el.querySelector(tag) || el.getElementsByTagNameNS('*', tag)?.[0]
  return found?.textContent?.trim() ?? ''
}

function getNum(el: Element | null | undefined, tag: string): number {
  const v = getText(el, tag)
  return v ? parseFloat(v.replace(',', '.')) : 0
}

function validarChaveAcesso(chave: string): boolean {
  if (!chave || chave.length !== 44) return false
  // Validação do dígito verificador — módulo 11
  const digits = chave.slice(0, 43).split('').map(Number)
  let sum = 0, mult = 2
  for (let i = digits.length - 1; i >= 0; i--) {
    sum += digits[i] * mult
    mult = mult === 9 ? 2 : mult + 1
  }
  const rem = sum % 11
  const dv = rem < 2 ? 0 : 11 - rem
  return dv === parseInt(chave[43])
}

export function parseNFe(xmlString: string): NFeParsed {
  const erros: string[] = []
  let valido = true

  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'application/xml')

  if (doc.documentElement.nodeName === 'parsererror') {
    return {
      valido: false,
      erros: ['XML inválido ou mal formado'],
      xmlRaw: xmlString,
    } as NFeParsed
  }

  // Verificar namespace
  const nfeProc = doc.querySelector('nfeProc, NFe')
  const infNFe = doc.querySelector('infNFe')

  if (!infNFe) {
    erros.push('Estrutura XML inválida: nó infNFe não encontrado')
    valido = false
  }

  // Chave de Acesso (atributo Id do infNFe)
  const chaveRaw = infNFe?.getAttribute('Id') ?? ''
  const chaveAcesso = chaveRaw.startsWith('NFe') ? chaveRaw.slice(3) : chaveRaw

  if (!validarChaveAcesso(chaveAcesso)) {
    erros.push(`Chave de acesso inválida: ${chaveAcesso}`)
  }

  // IDE
  const ide = infNFe?.querySelector('ide')
  const modelo = getText(ide, 'mod')
  if (modelo !== '55') erros.push(`Modelo ${modelo} não é NF-e (deve ser 55)`)

  // EMITENTE
  const emit = infNFe?.querySelector('emit')
  const crtEmitente = getText(emit, 'CRT')

  // DESTINATÁRIO
  const dest = infNFe?.querySelector('dest')

  // TOTAIS
  const total = infNFe?.querySelector('total ICMSTot, ICMSTot')

  // TRANSPORTE
  const transp = infNFe?.querySelector('transp')

  // COBRANÇA / DUPLICATAS
  const cobr = infNFe?.querySelector('cobr')
  const dups = cobr?.querySelectorAll('dup') ?? []
  const duplicatas = Array.from(dups).map(d => ({
    numero: getText(d, 'nDup'),
    vencimento: getText(d, 'dVenc'),
    valor: getNum(d, 'vDup'),
  }))

  // INFORMAÇÕES ADICIONAIS
  const infAdic = infNFe?.querySelector('infAdic')

  // ITENS
  const dets = infNFe?.querySelectorAll('det') ?? []
  const itens: NFeItem[] = Array.from(dets).map(det => {
    const prod = det.querySelector('prod')
    const imposto = det.querySelector('imposto')

    // ICMS — pode ter diferentes grupos (ICMS00, ICMS10, ICMS20, etc.)
    const icmsGrupo = imposto?.querySelector('[*|CST], ICMS00, ICMS10, ICMS20, ICMS30, ICMS40, ICMS41, ICMS50, ICMS51, ICMS60, ICMS70, ICMS90') ||
      imposto?.querySelector('ICMSSN102, ICMSSN300, ICMSSN400, ICMSSN500, ICMSSN900')

    // Buscar dentro de qualquer subelemento do ICMS
    const icmsEl = imposto?.querySelector('ICMS')
    const icmsChild = icmsEl?.firstElementChild

    const ipi = imposto?.querySelector('IPI')
    const ipiTrib = ipi?.querySelector('IPITrib')
    const pis = imposto?.querySelector('PIS')
    const pisAliq = pis?.querySelector('PISAliq, PISQtde, PISNT, PISOutr')
    const cofins = imposto?.querySelector('COFINS')
    const cofinsAliq = cofins?.querySelector('COFINSAliq, COFINSQtde, COFINSNT, COFINSOutr')

    return {
      nItem: parseInt(det.getAttribute('nItem') ?? '0'),
      cProd: getText(prod, 'cProd'),
      cEAN: getText(prod, 'cEAN'),
      xProd: getText(prod, 'xProd'),
      NCM: getText(prod, 'NCM'),
      CEST: getText(prod, 'CEST'),
      CFOP: getText(prod, 'CFOP'),
      uCom: getText(prod, 'uCom'),
      qCom: getNum(prod, 'qCom'),
      vUnCom: getNum(prod, 'vUnCom'),
      vProd: getNum(prod, 'vProd'),
      vFrete: getNum(prod, 'vFrete'),
      vSeg: getNum(prod, 'vSeg'),
      vDesc: getNum(prod, 'vDesc'),
      vOutro: getNum(prod, 'vOutro'),
      // ICMS
      origICMS: getText(icmsChild, 'orig'),
      CSTICMS: getText(icmsChild, 'CST') || getText(icmsChild, 'CSOSN'),
      modBCICMS: getText(icmsChild, 'modBC'),
      vBCICMS: getNum(icmsChild, 'vBC'),
      pICMS: getNum(icmsChild, 'pICMS'),
      vICMS: getNum(icmsChild, 'vICMS'),
      vBCST: getNum(icmsChild, 'vBCST'),
      pICMSST: getNum(icmsChild, 'pICMSST'),
      vICMSST: getNum(icmsChild, 'vICMSST'),
      // IPI
      CSTIPI: getText(ipiTrib, 'CST') || getText(ipi?.querySelector('IPINT'), 'CST') || '49',
      vBCIPI: getNum(ipiTrib, 'vBC'),
      pIPI: getNum(ipiTrib, 'pIPI'),
      vIPI: getNum(ipiTrib, 'vIPI'),
      // PIS
      CSTPIS: getText(pisAliq, 'CST'),
      vBCPIS: getNum(pisAliq, 'vBC'),
      pPIS: getNum(pisAliq, 'pPIS'),
      vPIS: getNum(pisAliq, 'vPIS'),
      // COFINS
      CSTCOFINS: getText(cofinsAliq, 'CST'),
      vBCCOFINS: getNum(cofinsAliq, 'vBC'),
      pCOFINS: getNum(cofinsAliq, 'pCOFINS'),
      vCOFINS: getNum(cofinsAliq, 'vCOFINS'),
    }
  })

  if (itens.length === 0 && valido) {
    erros.push('Nenhum item encontrado na NF-e')
  }

  return {
    chaveAcesso,
    numeroNF: getText(ide, 'nNF'),
    serie: getText(ide, 'serie'),
    dataEmissao: (getText(ide, 'dhEmi') || getText(ide, 'dEmi'))?.split('T')[0] || new Date().toISOString().split('T')[0],
    dataEntrada: (getText(ide, 'dhSaiEnt') || getText(ide, 'dSaiEnt'))?.split('T')[0] || (getText(ide, 'dhEmi') || getText(ide, 'dEmi'))?.split('T')[0] || new Date().toISOString().split('T')[0],
    natOperacao: getText(ide, 'natOp'),
    modelo,
    tpNF: getText(ide, 'tpNF'),
    cnpjEmitente: getText(emit, 'CNPJ'),
    nomeEmitente: getText(emit, 'xNome'),
    fantEmitente: getText(emit, 'xFant'),
    ufEmitente: getText(emit, 'UF'),
    crtEmitente,
    ieEmitente: getText(emit, 'IE'),
    cnpjDestinatario: getText(dest, 'CNPJ') || getText(dest, 'CPF'),
    nomeDestinatario: getText(dest, 'xNome'),
    valorProdutos: getNum(total, 'vProd'),
    valorFrete: getNum(total, 'vFrete'),
    valorSeguro: getNum(total, 'vSeg'),
    valorDesconto: getNum(total, 'vDesc'),
    valorIPI: getNum(total, 'vIPI'),
    valorPIS: getNum(total, 'vPIS'),
    valorCOFINS: getNum(total, 'vCOFINS'),
    valorICMS: getNum(total, 'vICMS'),
    valorTotal: getNum(total, 'vNF'),
    valorTotTrib: getNum(total, 'vTotTrib'),
    modFrete: getText(transp, 'modFrete'),
    duplicatas,
    infComplementar: getText(infAdic, 'infCpl'),
    infAdFisco: getText(infAdic, 'infAdFisco'),
    itens,
    xmlRaw: xmlString,
    valido: valido && erros.length === 0,
    erros,
  }
}

export async function parseNFeFile(file: File): Promise<NFeParsed> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      resolve(parseNFe(content))
    }
    reader.onerror = reject
    reader.readAsText(file, 'UTF-8')
  })
}

export async function parseNFeZip(file: File): Promise<NFeParsed[]> {
  // Para ZIP, retorna array de NF-es — requer JSZip (opcional)
  // Se JSZip não estiver disponível, retorna array vazio com mensagem
  return []
}
