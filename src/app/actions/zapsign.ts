'use server'
import { AssociadoInput } from '@/lib/types'

const ZAPSIGN_API_BASE = 'https://api.zapsign.com.br/api/v1'

export interface ZapSignSigner {
  name: string
  email: string
  external_id: string
  phone_number: string
  status: string
  signed_at: string
}

export interface ZapSignDoc {
  token: string
  name: string
  status: string
  signers: ZapSignSigner[]
}

/**
 * Server Action para buscar dados da ZapSign
 * Agora com filtro de Signatário Principal para evitar duplicatas (Leandro Xavier, etc)
 */
export async function fetchZapSignAssociatesAction(apiToken: string) {
  try {
    const allDocsWithDetails: ZapSignDoc[] = []
    let page = 1
    let hasMore = true

    // 1. Coleta todos os documentos e seus detalhes (paginado)
    while (hasMore) {
      const docsRes = await fetch(`${ZAPSIGN_API_BASE}/docs/?page=${page}`, {
        headers: { 
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        next: { revalidate: 0 }
      })
      
      if (!docsRes.ok) break

      const body = await docsRes.json()
      const results = Array.isArray(body) ? body : (body.results || [])
      
      if (!results || results.length === 0) {
        hasMore = false
        break
      }

      for (const doc of results) {
        // REGRA DE SEGURANÇA: Só importa o que for Termo de Adesão e da ACPROBEC
        const nameUpper = (doc.name || '').toUpperCase()
        if (!nameUpper.includes('ADESÃO') && !nameUpper.includes('ACPROBEC') && !nameUpper.includes('TERMO')) {
          console.log(`[ZapSign] Pulando documento irrelevante: ${doc.name}`)
          continue
        }

        const docDetailRes = await fetch(`${ZAPSIGN_API_BASE}/docs/${doc.token}/`, {
          headers: { 'Authorization': `Bearer ${apiToken}` }
        })
        if (docDetailRes.ok) {
          const detail = await docDetailRes.json()
          allDocsWithDetails.push(detail)
        }
      }

      if (results.length < 25) hasMore = false
      else page++
      if (page > 20) hasMore = false
    }

    // 2. Análise de Frequência para identificar administradores/testemunhas
    const nameFrequency = new Map<string, number>()
    allDocsWithDetails.forEach(doc => {
      doc.signers.forEach(s => {
        nameFrequency.set(s.name, (nameFrequency.get(s.name) || 0) + 1)
      })
    })

    // 3. Extração com Ranking: Apenas o Signatário mais provável de ser o Associado
    const newAssociates: AssociadoInput[] = []
    
    for (const doc of allDocsWithDetails) {
      const sysStatus = doc.status === 'signed' ? 'ativo' : 'pendente'
      
      // Calculamos o 'Score de Associado' para cada signatário
      // Quanto MENOR a frequência global, MAIOR a chance de ser o associado real
      const rankedSigners = doc.signers.map(s => {
        let score = 100
        const freq = nameFrequency.get(s.name) || 0
        
        // Penaliza por frequência (Diretores aparecem muito, associados aparecem 1 vez)
        score -= (freq * 10) 
        
        // Penaliza e-mails administrativos e nomes conhecidos
        if (s.email === 'acprobec@gmail.com') score -= 500
        if (s.name.toLowerCase().includes('leandro xavier')) score -= 500
        if (s.name.toLowerCase().includes('antonio pereira')) score -= 500
        if (s.name.toLowerCase().includes('diretor')) score -= 200

        return { signer: s, score }
      })

      // Ordena pelo maior score e pega o vencedor
      rankedSigners.sort((a, b) => b.score - a.score)
      const primarySigner = rankedSigners[0]?.signer

      if (primarySigner) {
        const signer = primarySigner
        const foundCpf = (signer as any).cpf || (signer as any).cnpj || (signer as any).gov_id || ''
        const cleanedCpf = foundCpf.replace(/\D/g, '')

        const emailKey = signer.email ? signer.email.toLowerCase().trim() : ''
        const nameSlug = signer.name.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .trim()

        // Prioridade de Identificação Invariável: CPF > Email > Nome
        const stableKey = cleanedCpf ? `CPF-${cleanedCpf}` : (emailKey ? `EMAIL-${emailKey}` : `NAME-${nameSlug}`)

        newAssociates.push({
          nome: signer.name,
          email: signer.email || '',
          cpf: cleanedCpf || '',
          telefone: signer.phone_number || '',
          categoria: 'ZapSign',
          mensalidade: 50,
          status: sysStatus,
          data_ingresso: signer.signed_at ? signer.signed_at.split('T')[0] : new Date().toISOString().split('T')[0],
          codigo: stableKey
        })
      }
    }

    // 4. Deduplicação final por pessoa (caso a pessoa tenha assinado 2 docs diferentes)
    const uniqueMap = new Map<string, AssociadoInput>()
    newAssociates.forEach(a => {
      const existing = uniqueMap.get(a.codigo)
      if (!existing || (existing.status !== 'ativo' && a.status === 'ativo')) {
        uniqueMap.set(a.codigo, a)
      }
    })
    
    return { data: Array.from(uniqueMap.values()) }
  } catch (error: any) {
    console.error('[ZapSignAction] Fatal Error:', error)
    return { error: error.message || 'Falha na conexão com a ZapSign' }
  }
}
