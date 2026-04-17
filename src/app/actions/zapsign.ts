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
 * Server Action para buscar dados da ZapSign sem erro de CORS
 */
export async function fetchZapSignAssociatesAction(apiToken: string) {
  try {
    const newAssociates: AssociadoInput[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      // 1. Busca documentos (todos os status) com paginação
      const docsRes = await fetch(`${ZAPSIGN_API_BASE}/docs/?page=${page}`, {
        headers: { 
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        next: { revalidate: 0 }
      })
      
      if (!docsRes.ok) throw new Error(`Erro na página ${page} da ZapSign`)

      const body = await docsRes.json()
      const results = Array.isArray(body) ? body : (body.results || [])
      
      // Se a página vier vazia, paramos
      if (!results || results.length === 0) {
        hasMore = false
        break
      }

      for (const doc of results) {
        // Buscamos o detalhe do doc para ter acesso aos campos dos signatários
        const docDetailRes = await fetch(`${ZAPSIGN_API_BASE}/docs/${doc.token}/`, {
          headers: { 'Authorization': `Bearer ${apiToken}` }
        })
        
        if (!docDetailRes.ok) continue
        const docDetail = (await docDetailRes.json()) as ZapSignDoc

        // Status do associado baseado no documento
        const sysStatus = docDetail.status === 'signed' ? 'ativo' : 'pendente'

        docDetail.signers.forEach(signer => {
          // Lógica de descoberta do CPF/CNPJ:
          // Procuramos em 'cpf', 'cnpj', 'external_id' e no objeto 'attributes' (campos customizados)
          let foundCpf = (signer as any).cpf || (signer as any).cnpj || signer.external_id || (signer as any).gov_id || ''
          
          // Se ainda estiver vazio, procura nos custom attributes
          if (!foundCpf && (signer as any).attributes) {
            const attrs = (signer as any).attributes
            // Tenta encontrar por chaves comuns
            foundCpf = attrs.cpf || attrs.CPF || attrs.cnpj || attrs.CNPJ || attrs.documento || attrs.document || ''
            
            // Se ainda não achou, procura por um valor que tenha formato de CPF (11 ou 14 dígitos)
            if (!foundCpf) {
              for (const val of Object.values(attrs)) {
                if (typeof val === 'string' && /^\d{11}$|^\d{14}$/.test(val.replace(/\D/g, ''))) {
                  foundCpf = val; break
                }
              }
            }
          }

          newAssociates.push({
            nome: signer.name,
            email: signer.email || '',
            cpf: foundCpf,
            telefone: signer.phone_number || '',
            categoria: 'ZapSign',
            mensalidade: 50,
            status: sysStatus,
            data_ingresso: signer.signed_at ? signer.signed_at.split('T')[0] : new Date().toISOString().split('T')[0],
            codigo: foundCpf || (signer as any).token || `ZS-${Math.random().toString(36).substr(2, 5)}`
          })
        })
      }

      // Se retornou menos que 25, provavelmente é a última página
      if (results.length < 25) {
        hasMore = false
      } else {
        page++
      }

      // Segurança: Limite de 20 páginas (500 docs) para evitar loop infinito em erros
      if (page > 20) hasMore = false
    }

    // Deduplica pelo CPF (prioridade) ou Nome para evitar redundância no import
    const uniqueMap = new Map()
    newAssociates.forEach(a => {
      const key = (a.cpf || a.nome).toLowerCase().replace(/\D/g, '') || a.nome.toLowerCase()
      uniqueMap.set(key, a)
    })
    
    return { data: Array.from(uniqueMap.values()) }
  } catch (error: any) {
    console.error('[ZapSignAction] Fatal Error:', error)
    return { error: error.message || 'Falha na conexão com a ZapSign' }
  }
}
