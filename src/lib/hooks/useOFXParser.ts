'use client'
// Versão 3.0 - Auditoria completa com metadados de saldo bancário
import { useCallback } from 'react'

export interface OFXTransaction {
  id: string
  type: 'DEBIT' | 'CREDIT' | 'OTHER'
  date: string // YYYY-MM-DD
  amount: number
  memo: string
  fitid: string
  metodo_inferido?: 'PIX' | 'Boleto' | 'Transferência'
  cpf_extraido?: string
  taxa?: number
}

export interface OFXParseResult {
  transactions: OFXTransaction[]
  ledgerBal?: number   // <LEDGERBAL><BALAMT>
  availBal?: number    // <AVAILBAL><BALAMT>
  dtAsOf?: string      // data do saldo
  bankId?: string      // <BANKID>
  acctId?: string      // <ACCTID>
}

export function useOFXParser() {

  const extractCPF = (text: string): string | undefined => {
    const clean = text.replace(/[^\d]/g, '')
    const cpfMatch = clean.match(/\d{11}/)
    const cnpjMatch = clean.match(/\d{14}/)
    return cnpjMatch?.[0] || cpfMatch?.[0]
  }

  const parseAmount = (raw: string): number => {
    const clean = raw.replace(/[^-0-9,.]/g, '')
    if (!clean) return 0
    let amount = 0
    if (clean.includes(',') && clean.includes('.')) {
      amount = parseFloat(clean.replace(/\./g, '').replace(',', '.'))
    } else if (clean.includes(',')) {
      amount = parseFloat(clean.replace(',', '.'))
    } else {
      amount = parseFloat(clean)
    }
    return isNaN(amount) ? 0 : amount
  }

  const parseOFX = useCallback((ofxContent: string): OFXParseResult => {
    const transactions: OFXTransaction[] = []

    // Parse das transações
    const trnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi
    let match

    while ((match = trnRegex.exec(ofxContent)) !== null) {
      const content = match[1]

      const type = content.match(/<TRNTYPE>([^<\n\r]*)/i)?.[1]?.trim() || 'OTHER'
      const dtPosted = content.match(/<DTPOSTED>([^<\n\r]*)/i)?.[1]?.trim() || ''
      const fitid = content.match(/<FITID>([^<\n\r]*)/i)?.[1]?.trim() || ''
      const memo =
        content.match(/<MEMO>([^<\n\r]*)/i)?.[1]?.trim() ||
        content.match(/<NAME>([^<\n\r]*)/i)?.[1]?.trim() ||
        'Sem descrição'

      // Converter data YYYYMMDD → YYYY-MM-DD
      const year = dtPosted.substring(0, 4)
      const month = dtPosted.substring(4, 6)
      const day = dtPosted.substring(6, 8)
      const formattedDate = `${year}-${month}-${day}`

      const cleanMemo = memo
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/<\/?[A-Z0-9]+>/gi, '')
        .trim()

      const trnAmtRaw = content.match(/<TRNAMT>([^<\n\r]*)/i)?.[1]?.trim() || '0'
      const rawAmount = parseAmount(trnAmtRaw)

      // TRNTYPE é a fonte primária; valor positivo sem indicação de débito = crédito
      const upperType = type.toUpperCase()
      const isCredit =
        upperType.includes('CREDIT') ||
        upperType.includes('DEP') ||
        (rawAmount > 0 && !upperType.includes('DEB'))
      const amount = Math.abs(rawAmount)

      // Inferência do método de pagamento
      let inferedMethod: 'PIX' | 'Boleto' | 'Transferência' | undefined = undefined
      const upperMemo = cleanMemo.toUpperCase()
      if (upperMemo.includes('PIX')) {
        inferedMethod = 'PIX'
      } else if (
        upperMemo.includes('PAGAMENTO RECEBIDO') ||
        upperMemo.includes('BOLETO') ||
        upperMemo.includes('TITULO') ||
        upperMemo.includes('COBRANCA') ||
        upperMemo.includes('LIQUIDACAO')
      ) {
        inferedMethod = 'Boleto'
      } else if (upperMemo.includes('TRANSFERENCIA') || upperMemo.includes('TRANSF')) {
        inferedMethod = 'Transferência'
      }

      transactions.push({
        id: fitid || Math.random().toString(36).substring(7),
        type: isCredit ? 'CREDIT' : 'DEBIT',
        date: formattedDate,
        amount,
        memo: cleanMemo,
        fitid,
        metodo_inferido: inferedMethod,
        cpf_extraido: extractCPF(cleanMemo),
        taxa: 0,
      })
    }

    // Parse dos metadados bancários (saldo e conta)
    const ledgerBalRaw = ofxContent.match(
      /<LEDGERBAL>[\s\S]*?<BALAMT>([^<\n\r]*)/i
    )?.[1]?.trim()
    const availBalRaw = ofxContent.match(
      /<AVAILBAL>[\s\S]*?<BALAMT>([^<\n\r]*)/i
    )?.[1]?.trim()
    const dtAsOf = ofxContent.match(
      /<LEDGERBAL>[\s\S]*?<DTASOF>([^<\n\r]*)/i
    )?.[1]?.trim()
    const bankId = ofxContent.match(/<BANKID>([^<\n\r]*)/i)?.[1]?.trim()
    const acctId = ofxContent.match(/<ACCTID>([^<\n\r]*)/i)?.[1]?.trim()

    return {
      transactions,
      ledgerBal: ledgerBalRaw ? parseAmount(ledgerBalRaw) : undefined,
      availBal: availBalRaw ? parseAmount(availBalRaw) : undefined,
      dtAsOf,
      bankId,
      acctId,
    }
  }, [])

  return { parseOFX }
}
