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
    // 1. Lista documentos assinados (signed)
    const docsRes = await fetch(`${ZAPSIGN_API_BASE}/docs/?status=signed`, {
      headers: { 
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 } // Desabilita cache para dados sempre frescos
    })
    
    if (!docsRes.ok) {
      const errorData = await docsRes.text()
      console.error('[ZapSignAction] API Error:', errorData)
      throw new Error('Erro ao consultar ZapSign docs')
    }

    const { results: docs } = (await docsRes.json()) as { results: ZapSignDoc[] }
    const newAssociates: AssociadoInput[] = []

    for (const doc of docs) {
      const docDetailRes = await fetch(`${ZAPSIGN_API_BASE}/docs/${doc.token}/`, {
        headers: { 'Authorization': `Bearer ${apiToken}` }
      })
      
      if (!docDetailRes.ok) continue
      const docDetail = (await docDetailRes.json()) as ZapSignDoc

      docDetail.signers.forEach(signer => {
        if (signer.status === 'signed') {
          newAssociates.push({
            nome: signer.name,
            email: signer.email || '',
            cpf: signer.external_id || '',
            telefone: signer.phone_number || '',
            categoria: 'ZapSign',
            mensalidade: 50,
            status: 'ativo',
            data_ingresso: signer.signed_at ? signer.signed_at.split('T')[0] : new Date().toISOString().split('T')[0],
            codigo: signer.external_id || `ZS-${Math.random().toString(36).substr(2, 5)}`
          })
        }
      })
    }

    // Deduplica pelo CPF/Nome
    const uniqueMap = new Map()
    newAssociates.forEach(a => uniqueMap.set(a.cpf || a.nome, a))
    
    return { data: Array.from(uniqueMap.values()) }
  } catch (error: any) {
    console.error('[ZapSignAction] Fatal Error:', error)
    return { error: error.message || 'Falha na conexão com a ZapSign' }
  }
}
