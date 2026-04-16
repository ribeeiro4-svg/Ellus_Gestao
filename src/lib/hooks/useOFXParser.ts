'use client'
import { useCallback } from 'react'

export interface OFXTransaction {
  id: string
  type: 'DEBIT' | 'CREDIT' | 'OTHER'
  date: string // YYYY-MM-DD
  amount: number
  memo: string
  fitid: string
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

      const amount = Math.abs(parseFloat(trnAmt.replace(',', '.')))

      // Só adiciona se houver valor real (ignora lançamentos informativos de valor 0)
      if (amount > 0) {
        transactions.push({
          id: fitid || Math.random().toString(36).substring(7),
          type: type.includes('DEP') || type.includes('CREDIT') ? 'CREDIT' : 'DEBIT',
          date: formattedDate,
          amount,
          memo: cleanMemo,
          fitid,
          cpf_extraido: extractCPF(cleanMemo)
        })
      }
    }
    
    return transactions
  }, [])

  return { parseOFX }
}
