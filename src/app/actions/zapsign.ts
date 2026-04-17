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
          // Importamos o signatário se ele for do tipo "Signer" (e não o remetente, se houver diferenciação)
          // Na ZapSign, geralmente todos na lista signers são pessoas que precisam assinar
          // Filtramos apenas quem realmente é um "cliente/associado" se houver lógica pra isso, 
          // mas aqui pegaremos todos os signatários.
          
          newAssociates.push({
            nome: signer.name,
            email: signer.email || '',
            cpf: (signer as any).cpf || signer.external_id || '', // Busca no campo 'cpf' conforme docs
            telefone: signer.phone_number || '',
            categoria: 'ZapSign',
            mensalidade: 50,
            status: sysStatus,
            data_ingresso: signer.signed_at ? signer.signed_at.split('T')[0] : new Date().toISOString().split('T')[0],
            codigo: (signer as any).cpf || signer.external_id || `ZS-${Math.random().toString(36).substr(2, 5)}`
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
