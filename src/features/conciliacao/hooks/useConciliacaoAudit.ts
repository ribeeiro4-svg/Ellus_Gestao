import { useMemo } from 'react'
import { safeSum, safeDiff } from '@/lib/utils/formatters'

interface BankItem {
  fitid: string
  memo: string
  amount: number
  type: string
  date: string
  metodo_inferido?: string
  documento?: string
}

export function useConciliacaoAudit(
  extrato: any[], 
  coraItems: any[], 
  activeTab: 'ofx' | 'cora',
  associados: any[],
  fornecedores: any[],
  diretoria: any[],
  lancamentos: any[],
  processedIds: Set<string>
) {
  const existingTxIds = useMemo(() => new Set(lancamentos.map(l => l.banco_transacao_id).filter(Boolean)), [lancamentos])

  const extractDocument = (memo: string) => {
    const raw = memo.replace(/\D/g, '')
    const cnpjMatch = raw.match(/\d{14}/)
    const cpfMatch = raw.match(/\d{11}/)
    return cnpjMatch ? cnpjMatch[0] : (cpfMatch ? cpfMatch[0] : null)
  }

  const getAuditMatch = useMemo(() => (bankMemo: string, bankAmount: number, bankType: string) => {
    const memo = bankMemo.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    const numbersInMemo = memo.replace(/\D/g, '')
    const extractedDoc = extractDocument(bankMemo)
    
    // 1. Prioridade Máxima: CPF / CNPJ
    const dirCpfMatch = diretoria.find(d => d.cpf && numbersInMemo.includes(d.cpf.replace(/\D/g, '')))
    if (dirCpfMatch) return { forMatch: { ...dirCpfMatch, isDirector: true }, assocMatch: null, suggestedCategory: 'Verba Diretoria / Administrativo', isAdesao: false }

    const assocCpfMatch = associados.find(a => a.cpf && numbersInMemo.includes(a.cpf.replace(/\D/g, '')))
    if (assocCpfMatch) {
      const isAdesao = !lancamentos.some(l => l.associado_id === assocCpfMatch.id)
      return { assocMatch: assocCpfMatch, forMatch: null, suggestedCategory: isAdesao ? 'ADESÃO' : 'Mensalidades', isAdesao }
    }

    // 2. Prioridade Média: Nome Completo (Exato)
    const normalizeName = (n: string) => n.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
    
    const assocExactMatch = associados.find(a => memo.includes(normalizeName(a.nome)))
    if (assocExactMatch) {
      const isAdesao = !lancamentos.some(l => l.associado_id === assocExactMatch.id)
      return { 
        assocMatch: assocExactMatch, 
        forMatch: null, 
        suggestedCategory: isAdesao ? 'ADESÃO' : 'Mensalidades', 
        isAdesao,
        needsUpdate: !assocExactMatch.cpf && !!extractedDoc,
        newDocument: extractedDoc
      }
    }

    const dirExactMatch = diretoria.find(d => memo.includes(normalizeName(d.nome)))
    if (dirExactMatch) return { forMatch: { ...dirExactMatch, isDirector: true }, assocMatch: null, suggestedCategory: 'Verba Diretoria / Administrativo', isAdesao: false }

    // 3. Match Inteligente de Fragmentos (Fuzzy)
    const fuzzyMatch = (targetName: string) => {
      const parts = normalizeName(targetName).split(' ').filter(p => p.length > 3)
      if (parts.length < 2) return false
      return memo.includes(parts[0]) && parts.slice(1).some(p => memo.includes(p))
    }

    const assocFuzzy = associados.find(a => fuzzyMatch(a.nome))
    if (assocFuzzy) {
      const isAdesao = !lancamentos.some(l => l.associado_id === assocFuzzy.id)
      return { 
        assocMatch: assocFuzzy, 
        forMatch: null, 
        suggestedCategory: isAdesao ? 'ADESÃO' : 'Mensalidades', 
        isAdesao,
        needsUpdate: !assocFuzzy.cpf && !!extractedDoc,
        newDocument: extractedDoc
      }
    }

    const dirFuzzy = diretoria.find(d => fuzzyMatch(d.nome))
    if (dirFuzzy) return { forMatch: { ...dirFuzzy, isDirector: true }, assocMatch: null, suggestedCategory: 'Verba Diretoria / Administrativo', isAdesao: false }

    const forMatch = fornecedores.find(f => {
      const nF = normalizeName(f.nome)
      const cF = (f as any).cpf_cnpj?.replace(/\D/g, '')
      return (cF && numbersInMemo.includes(cF)) || memo.includes(nF)
    })

    return {
      assocMatch: null,
      forMatch: forMatch ? { ...forMatch, isDirector: false } : null,
      suggestedCategory: forMatch ? (forMatch as any).categoria_padrao : 'Outros',
      isAdesao: false
    }
  }, [associados, fornecedores, diretoria, lancamentos])

  const matchedTransactions = useMemo(() => {
    return extrato.map((bank: any) => {
      // Priorizar vínculo manual se ele já existir no objeto do extrato (OFX)
      if (bank.assocMatch !== undefined || bank.forMatch !== undefined) {
        return { 
          bank, 
          assocMatch: bank.assocMatch, 
          forMatch: bank.forMatch, 
          suggestedCategory: bank.suggestedCategory,
          isAdesao: bank.isAdesao || false,
          needsUpdate: false,
          newDocument: null
        }
      }
      const audit = getAuditMatch(bank.memo, bank.amount, bank.type)
      return { bank, ...audit }
    })
  }, [extrato, getAuditMatch])

  const coraMatchedItems = useMemo(() => {
    return (coraItems || []).map((bank: any) => {
      const normalizedBank = {
        fitid: bank.cora_id || bank.id,
        memo: bank.descricao,
        amount: bank.valor,
        type: bank.tipo,
        date: bank.data,
        metodo_inferido: bank.descricao.toUpperCase().includes('PIX') ? 'PIX' : bank.descricao.toUpperCase().includes('BOLETO') ? 'BOLETO' : 'Transferência'
      }

      // Priorizar vínculo manual se ele já existir no objeto (Cora)
      if (bank.assocMatch !== undefined || bank.forMatch !== undefined) {
        return { 
          bank: normalizedBank, 
          assocMatch: bank.assocMatch, 
          forMatch: bank.forMatch, 
          suggestedCategory: bank.suggestedCategory,
          isAdesao: bank.isAdesao || false,
          needsUpdate: false,
          newDocument: null
        }
      }

      const audit = getAuditMatch(bank.descricao, bank.valor, bank.tipo)
      return { bank: normalizedBank, ...audit }
    })
  }, [coraItems, getAuditMatch])

  const auditStats = useMemo(() => {
    const list = activeTab === 'ofx' ? matchedTransactions : coraMatchedItems
    let credits = 0, debits = 0, duplicates = 0, linked = 0, unlinked = 0
    list.forEach(i => {
      if (processedIds.has(i.bank.fitid)) return
      
      const val = Math.abs(i.bank.amount)
      if (i.bank.type === 'CREDIT') {
        credits = safeSum(credits, val)
      } else {
        debits = safeSum(debits, val)
      }

      if (existingTxIds.has(i.bank.fitid)) duplicates++
      else if (i.assocMatch || i.forMatch) linked++
      else unlinked++
    })
    return { credits, debits, balance: safeDiff(credits, debits), duplicates, linked, unlinked }
  }, [activeTab, matchedTransactions, coraMatchedItems, existingTxIds, processedIds])

  return {
    matchedTransactions,
    coraMatchedItems,
    existingTxIds,
    auditStats,
    getAuditMatch
  }
}
