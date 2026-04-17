import { AssociadoInput } from '../types'

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
 * Serviço para interfacear com a API ZapSign
 */
export const zapsignService = {
  /**
   * Busca todos os signatários de documentos assinados
   */
  async fetchNewAssociates(apiToken: string): Promise<AssociadoInput[]> {
    try {
      // 1. Lista documentos assinados (signed)
      const docsRes = await fetch(`${ZAPSIGN_API_BASE}/docs/?status=signed`, {
        headers: { 'Authorization': `Bearer ${apiToken}` }
      })
      
      if (!docsRes.ok) throw new Error('Erro ao consultar ZapSign docs')
      const { results: docs } = (await docsRes.json()) as { results: ZapSignDoc[] }

      const newAssociates: AssociadoInput[] = []

      // 2. Para cada documento, extraímos os signatários
      // Nota: Em uma conta real com muitos docs, talvez precise de paginação ou buscar detalhes
      for (const doc of docs) {
        // Buscamos o detalhe do doc para garantir que temos todos os campos do signatário
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
              cpf: signer.external_id || '', // Usuário confirmou que está preenchido
              telefone: signer.phone_number || '',
              categoria: 'ZapSign', // Categoria padrão para identificação
              mensalidade: 50, // Valor padrão conforme solicitado
              status: 'ativo',
              data_ingresso: signer.signed_at ? signer.signed_at.split('T')[0] : new Date().toISOString().split('T')[0],
              codigo: signer.external_id || `ZS-${Math.random().toString(36).substr(2, 5)}`
            })
          }
        })
      }

      // 3. Remove duplicatas internas à lista de importação (pelo CPF)
      const uniqueMap = new Map()
      newAssociates.forEach(a => uniqueMap.set(a.cpf || a.nome, a))
      
      return Array.from(uniqueMap.values())
    } catch (error) {
      console.error('[ZapSignService] Error:', error)
      throw error
    }
  }
}
