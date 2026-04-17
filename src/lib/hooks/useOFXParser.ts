'use client'
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
}

export function useOFXParser() {
  
  const extractCPF = (text: string): string | undefined => {
    // Regex para encontrar sequências de 11 ou 14 números (CPF/CNPJ)
    // Pode estar formatado ou apenas números
    const clean = text.replace(/[^\d]/g, '')
    const cpfMatch = clean.match(/\d{11}/)
    const cnpjMatch = clean.match(/\d{14}/)
    
    // Retornamos o primeiro que encontrar (CNPJ tem prioridade por ser mais longo)
    return cnpjMatch?.[0] || cpfMatch?.[0]
  }

  const parseOFX = useCallback((ofxContent: string): OFXTransaction[] => {
    const transactions: OFXTransaction[] = []
    
    // Simplistic Regex-based STMTTRN parser
    const trnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi
    let match
    
    while ((match = trnRegex.exec(ofxContent)) !== null) {
      const content = match[1]
      
      const type = /<TRNTYPE>(.*)/i.exec(content)?.[1]?.trim() || 'OTHER'
      const dtPosted = /<DTPOSTED>(.*)/i.exec(content)?.[1]?.trim() || '' // YYYYMMDD...
      const trnAmt = /<TRNAMT>(.*)/i.exec(content)?.[1]?.trim() || '0'
      const fitid = /<FITID>(.*)/i.exec(content)?.[1]?.trim() || ''
      const memo = /<MEMO>(.*)/i.exec(content)?.[1]?.trim() || /<NAME>(.*)/i.exec(content)?.[1]?.trim() || 'Sem descrição'
      
      // Convert Date: YYYYMMDD -> YYYY-MM-DD
      const year = dtPosted.substring(0, 4)
      const month = dtPosted.substring(4, 6)
      const day = dtPosted.substring(6, 8)
      const formattedDate = `${year}-${month}-${day}`
      
      const cleanMemo = memo.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')

      // Regex mais robusto para capturar a string numérica bruta
      const trnAmtRaw = /<TRNAMT>\s*([^<\s]*)/i.exec(content)?.[1] || '0'
      
      // Limpeza agressiva: remove qualquer coisa que não seja número, ponto, vírgula ou sinal
      const cleanVal = trnAmtRaw.replace(/[^-0-9,.]/g, '')
      
      // Converte para float (identificando se o separador decimal é vírgula ou ponto)
      let rawAmount = 0
      if (cleanVal.includes(',') && cleanVal.includes('.')) {
        rawAmount = parseFloat(cleanVal.replace(/\./g, '').replace(',', '.'))
      } else if (cleanVal.includes(',')) {
        rawAmount = parseFloat(cleanVal.replace(',', '.'))
      } else {
        rawAmount = parseFloat(cleanVal)
      }

      if (isNaN(rawAmount)) rawAmount = 0

      // REGRA DE OURO: O sinal do valor determina se é crédito ou débito
      // Créditos são positivos, Débitos são negativos no OFX padrão
      const isCredit = rawAmount > 0 || type.includes('DEP') || type.includes('CREDIT')
      const amount = Math.abs(rawAmount)

      // Inferência automática da forma de pagamento
      let inferedMethod: 'PIX' | 'Boleto' | 'Transferência' | undefined = undefined
      const upperMemo = cleanMemo.toUpperCase()
      
      if (upperMemo.includes('PIX')) {
        inferedMethod = 'PIX'
      } else if (upperMemo.includes('PAGAMENTO RECEBIDO') || upperMemo.includes('BOLETO') || upperMemo.includes('TITULO') || upperMemo.includes('COBRANCA') || upperMemo.includes('LIQUIDACAO')) {
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
        cpf_extraido: extractCPF(cleanMemo)
      })
    }
    
    return transactions
  }, [])

  return { parseOFX }
}
