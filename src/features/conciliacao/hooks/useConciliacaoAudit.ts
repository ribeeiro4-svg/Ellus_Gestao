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

  const getAuditMatch = useMemo(() => (bankMemo: string, bankAmount: number, bankType: string, bankDateStr: string) => {
    const memo = bankMemo.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    const numbersInMemo = memo.replace(/\D/g, '')
    const extractedDoc = extractDocument(bankMemo)
    
    const dirCpfMatch = diretoria.find(d => d.cpf && numbersInMemo.includes(d.cpf.replace(/\D/g, '')))
    if (dirCpfMatch) {
      const bankDate = new Date(bankDateStr)
      const m = bankDate.getMonth()
      const y = bankDate.getFullYear()

      const existingMatch = lancamentos.find(l => 
        l.diretor_id === dirCpfMatch.id && 
        l.tipo === (bankType === 'CREDIT' ? 'receita' : 'despesa') &&
        (l.status === 'aberto' || l.status === 'atrasado') && 
        ((l.competencia_mes === m && l.competencia_ano === y) || (new Date(l.data).getMonth() === m && new Date(l.data).getFullYear() === y))
      )
      return { forMatch: { ...dirCpfMatch, isDirector: true }, assocMatch: null, suggestedCategory: 'Verba Diretoria / Administrativo', isAdesao: false, existingMatch }
    }

    const assocCpfMatch = associados.find(a => a.cpf && numbersInMemo.includes(a.cpf.replace(/\D/g, '')))
    if (assocCpfMatch) {
      const bankDate = new Date(bankDateStr)
      const m = bankDate.getMonth()
      const y = bankDate.getFullYear()

      const existingMatch = lancamentos.find(l => 
        (l.associado_id === assocCpfMatch.id || l.descricao?.toUpperCase().includes(assocCpfMatch.nome.toUpperCase())) && 
        l.tipo === (bankType === 'CREDIT' ? 'receita' : 'despesa') &&
        (l.status === 'aberto' || l.status === 'atrasado') && 
        ((l.competencia_mes === m && l.competencia_ano === y) || (new Date(l.data).getMonth() === m && new Date(l.data).getFullYear() === y))
      )

      const hasAdesaoInSystem = lancamentos.some(l => l.associado_id === assocCpfMatch.id && (l.categoria === 'ADESÃO' || l.descricao?.toUpperCase().includes('ADESAO')))
      const hasAnyPayment = lancamentos.some(l => l.associado_id === assocCpfMatch.id && l.status === 'pago')
      
      // Se não tem pagamento nenhum e não tem adesão lançada, é um problema
      if (!hasAnyPayment && !hasAdesaoInSystem) {
        return { 
          assocMatch: assocCpfMatch, 
          forMatch: null, 
          suggestedCategory: 'ADESÃO', 
          warning: 'Adesão não lançada no sistema. Sincronize com ZapSign primeiro.',
          isAdesao: true,
          existingMatch
        }
      }

      return { 
        assocMatch: assocCpfMatch, 
        forMatch: null, 
        suggestedCategory: !hasAnyPayment ? 'ADESÃO' : 'Mensalidades', 
        isAdesao: !hasAnyPayment,
        existingMatch
      }
    }

    // 2. Prioridade Média: Nome Completo (Exato)
    const normalizeName = (n: string) => n.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
    
    const assocExactMatch = associados.find(a => memo.includes(normalizeName(a.nome)))
    if (assocExactMatch) {
      const bankDate = new Date(bankDateStr)
      const m = bankDate.getMonth()
      const y = bankDate.getFullYear()

      const existingMatch = lancamentos.find(l => 
        (l.associado_id === assocExactMatch.id || l.descricao?.toUpperCase().includes(assocExactMatch.nome.toUpperCase())) && 
        l.tipo === (bankType === 'CREDIT' ? 'receita' : 'despesa') &&
        (l.status === 'aberto' || l.status === 'atrasado') && 
        ((l.competencia_mes === m && l.competencia_ano === y) || (new Date(l.data).getMonth() === m && new Date(l.data).getFullYear() === y))
      )

      const hasAdesaoInSystem = lancamentos.some(l => l.associado_id === assocExactMatch.id && (l.categoria === 'ADESÃO' || l.descricao?.toUpperCase().includes('ADESAO')))
      const hasAnyPayment = lancamentos.some(l => l.associado_id === assocExactMatch.id && l.status === 'pago')
      
      const isAdesao = !hasAnyPayment

      return { 
        assocMatch: assocExactMatch, 
        forMatch: null, 
        suggestedCategory: isAdesao ? 'ADESÃO' : 'Mensalidades', 
        warning: (isAdesao && !hasAdesaoInSystem) ? 'Adesão não lançada no sistema. Sincronize com ZapSign primeiro.' : undefined,
        isAdesao,
        existingMatch,
        needsUpdate: !assocExactMatch.cpf && !!extractedDoc,
        newDocument: extractedDoc
      }
    }

    const dirExactMatch = diretoria.find(d => memo.includes(normalizeName(d.nome)))
    if (dirExactMatch) {
      const bankDate = new Date(bankDateStr)
      const m = bankDate.getMonth()
      const y = bankDate.getFullYear()

      const existingMatch = lancamentos.find(l => 
        l.diretor_id === dirExactMatch.id && 
        l.tipo === (bankType === 'CREDIT' ? 'receita' : 'despesa') &&
        (l.status === 'aberto' || l.status === 'atrasado') && 
        ((l.competencia_mes === m && l.competencia_ano === y) || (new Date(l.data).getMonth() === m && new Date(l.data).getFullYear() === y))
      )
      return { forMatch: { ...dirExactMatch, isDirector: true }, assocMatch: null, suggestedCategory: 'Verba Diretoria / Administrativo', isAdesao: false, existingMatch }
    }

    // 3. Match Inteligente de Fragmentos (Fuzzy)
    const fuzzyMatch = (targetName: string) => {
      const parts = normalizeName(targetName).split(' ').filter(p => p.length > 3)
      if (parts.length < 2) return false
      return memo.includes(parts[0]) && parts.slice(1).some(p => memo.includes(p))
    }

    const assocFuzzy = associados.find(a => fuzzyMatch(a.nome))
    if (assocFuzzy) {
      const bankDate = new Date(bankDateStr)
      const m = bankDate.getMonth()
      const y = bankDate.getFullYear()

      const existingMatch = lancamentos.find(l => 
        (l.associado_id === assocFuzzy.id || l.descricao?.toUpperCase().includes(assocFuzzy.nome.toUpperCase())) && 
        l.tipo === (bankType === 'CREDIT' ? 'receita' : 'despesa') &&
        (l.status === 'aberto' || l.status === 'atrasado') && 
        ((l.competencia_mes === m && l.competencia_ano === y) || (new Date(l.data).getMonth() === m && new Date(l.data).getFullYear() === y))
      )

      const isAdesao = !lancamentos.some(l => l.associado_id === assocFuzzy.id)
      return { 
        assocMatch: assocFuzzy, 
        forMatch: null, 
        suggestedCategory: isAdesao ? 'ADESÃO' : 'Mensalidades', 
        isAdesao,
        existingMatch,
        needsUpdate: !assocFuzzy.cpf && extractedDoc?.length === 11,
        newDocument: extractedDoc
      }
    }

    const dirFuzzy = diretoria.find(d => fuzzyMatch(d.nome))
    if (dirFuzzy) {
      const bankDate = new Date(bankDateStr)
      const m = bankDate.getMonth()
      const y = bankDate.getFullYear()

      const existingMatch = lancamentos.find(l => 
        l.diretor_id === dirFuzzy.id && 
        l.tipo === (bankType === 'CREDIT' ? 'receita' : 'despesa') &&
        (l.status === 'aberto' || l.status === 'atrasado') && 
        ((l.competencia_mes === m && l.competencia_ano === y) || (new Date(l.data).getMonth() === m && new Date(l.data).getFullYear() === y))
      )
      return { forMatch: { ...dirFuzzy, isDirector: true }, assocMatch: null, suggestedCategory: 'Verba Diretoria / Administrativo', isAdesao: false, existingMatch }
    }

    const forMatch = fornecedores.find(f => {
      const nF = normalizeName(f.nome)
      const cF = (f as any).cpf_cnpj?.replace(/\D/g, '')
      return (cF && numbersInMemo.includes(cF)) || memo.includes(nF)
    })

    let existingMatchFor = null
    if (forMatch) {
      const bankDate = new Date(bankDateStr)
      const m = bankDate.getMonth()
      const y = bankDate.getFullYear()

      existingMatchFor = lancamentos.find(l => 
        l.fornecedor_id === forMatch.id && 
        l.tipo === (bankType === 'CREDIT' ? 'receita' : 'despesa') &&
        (l.status === 'aberto' || l.status === 'atrasado') && 
        ((l.competencia_mes === m && l.competencia_ano === y) || (new Date(l.data).getMonth() === m && new Date(l.data).getFullYear() === y))
      )
    }

    return {
      assocMatch: null,
      forMatch: forMatch ? { ...forMatch, isDirector: false } : null,
      suggestedCategory: forMatch ? (forMatch as any).categoria_padrao : 'Outros',
      isAdesao: false,
      existingMatch: existingMatchFor
    }
  }, [associados, fornecedores, diretoria, lancamentos])

  const matchedTransactions = useMemo(() => {
    return extrato.map((bank: any) => {
      // Priorizar vínculo manual se ele já existir no objeto do extrato (OFX)
      if (bank.assocMatch !== undefined || bank.forMatch !== undefined) {
        let existingMatch = bank.existingMatch;
        if (existingMatch === undefined) {
          const bankDate = new Date(bank.date);
          const m = bankDate.getMonth();
          const y = bankDate.getFullYear();

          if (bank.forMatch) {
              existingMatch = lancamentos.find(l => 
                  l.fornecedor_id === bank.forMatch.id && 
                  l.tipo === (bank.type === 'CREDIT' ? 'receita' : 'despesa') &&
                  (l.status === 'aberto' || l.status === 'atrasado') && 
                  ((l.competencia_mes === m && l.competencia_ano === y) || (new Date(l.data).getMonth() === m && new Date(l.data).getFullYear() === y))
              )
          } else if (bank.assocMatch) {
              existingMatch = lancamentos.find(l => 
                  (l.associado_id === bank.assocMatch.id || (bank.assocMatch.isDirector && l.diretor_id === bank.assocMatch.id)) && 
                  l.tipo === (bank.type === 'CREDIT' ? 'receita' : 'despesa') &&
                  (l.status === 'aberto' || l.status === 'atrasado') && 
                  ((l.competencia_mes === m && l.competencia_ano === y) || (new Date(l.data).getMonth() === m && new Date(l.data).getFullYear() === y))
              )
          }
        }

        return { 
          bank, 
          assocMatch: bank.assocMatch, 
          forMatch: bank.forMatch, 
          suggestedCategory: bank.suggestedCategory,
          warning: bank.warning,
          existingMatch,
          isAdesao: bank.isAdesao || false,
          needsUpdate: false,
          newDocument: null
        }
      }
      const audit = getAuditMatch(bank.memo, bank.amount, bank.type, bank.date)
      return { bank, ...audit }
    })
  }, [extrato, getAuditMatch, lancamentos])

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
        let existingMatch = bank.existingMatch;
        if (existingMatch === undefined) {
          const bankDate = new Date(bank.data);
          const m = bankDate.getMonth();
          const y = bankDate.getFullYear();

          if (bank.forMatch) {
              existingMatch = lancamentos.find(l => 
                  l.fornecedor_id === bank.forMatch.id && 
                  l.tipo === (bank.tipo === 'CREDIT' ? 'receita' : 'despesa') &&
                  (l.status === 'aberto' || l.status === 'atrasado') && 
                  ((l.competencia_mes === m && l.competencia_ano === y) || (new Date(l.data).getMonth() === m && new Date(l.data).getFullYear() === y))
              )
          } else if (bank.assocMatch) {
              existingMatch = lancamentos.find(l => 
                  (l.associado_id === bank.assocMatch.id || (bank.assocMatch.isDirector && l.diretor_id === bank.assocMatch.id)) && 
                  l.tipo === (bank.tipo === 'CREDIT' ? 'receita' : 'despesa') &&
                  (l.status === 'aberto' || l.status === 'atrasado') && 
                  ((l.competencia_mes === m && l.competencia_ano === y) || (new Date(l.data).getMonth() === m && new Date(l.data).getFullYear() === y))
              )
          }
        }

        return { 
          bank: normalizedBank, 
          assocMatch: bank.assocMatch, 
          forMatch: bank.forMatch, 
          suggestedCategory: bank.suggestedCategory,
          warning: bank.warning,
          existingMatch: existingMatch || bank.existingMatch,
          isAdesao: bank.isAdesao || false,
          needsUpdate: false,
          newDocument: null
        }
      }

      const audit = getAuditMatch(bank.descricao, bank.valor, bank.tipo, bank.data)
      return { bank: normalizedBank, ...audit }
    })
  }, [coraItems, getAuditMatch, lancamentos])

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
