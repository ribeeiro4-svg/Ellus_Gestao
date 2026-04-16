'use client'
import { useCallback } from 'react'

export interface OFXTransaction {
  id: string
  type: 'DEBIT' | 'CREDIT' | 'OTHER'
  date: string // YYYY-MM-DD
  amount: number
  memo: string
  fitid: string
}

export function useOFXParser() {
  
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
      
      transactions.push({
        id: fitid || Math.random().toString(36).substring(7),
        type: type.includes('DEP') || type.includes('CREDIT') ? 'CREDIT' : 'DEBIT',
        date: formattedDate,
        amount: Math.abs(parseFloat(trnAmt.replace(',', '.'))), // Normalizamos para positivo no display
        memo: memo.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
        fitid
      })
    }
    
    return transactions
  }, [])

  return { parseOFX }
}
