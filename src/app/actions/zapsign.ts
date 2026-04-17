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
          // 1. Ignoramos o próprio e-mail da associação para não importar o administrador como associado
          if (signer.email === 'acprobec@gmail.com') return

          // 2. Captura apenas campos OFICIAIS de documento (sem tentar adivinhar em campos de contato)
          let foundCpf = (signer as any).cpf || (signer as any).cnpj || (signer as any).gov_id || ''
          const cleanedCpf = foundCpf.replace(/\D/g, '')

          // 3. Identificador Único Estável por Nome (Slug) para evitar duplicatas infinitas
          // Se o CPF existir, ele é o melhor código. Se não, usamos o nome normalizado.
          const nameSlug = signer.name.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .trim()

          const stableKey = cleanedCpf ? `CPF-${cleanedCpf}` : `NAME-${nameSlug}`

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
        })
      }

      if (results.length < 25) {
        hasMore = false
      } else {
        page++
      }

      if (page > 20) hasMore = false
    }

    // Deduplica e unifica registros
    const uniqueMap = new Map<string, AssociadoInput>()
    newAssociates.forEach(a => {
      const existing = uniqueMap.get(a.codigo)
      // Se já existe, damos prioridade para o que estiver 'ativo' (assinado)
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
