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
        const nameLower = (doc.name || '').toLowerCase()
        const nameClean = nameLower.normalize('NFD').replace(/[\u0300-\u036f]/g, "")
        
        const matches = [
          'adesao', 'acprobec', 'termo', 'inscricao', 'filiacao', 'associado', 'contrato', 'tamara'
        ]
        const isRelevant = matches.some(m => nameClean.includes(m))
        
        if (!isRelevant) continue

        // Chamada sem barra final e com revalidate: 0
        const docDetailRes = await fetch(`${ZAPSIGN_API_BASE}/docs/${doc.token}`, {
          headers: { 'Authorization': `Bearer ${apiToken}` },
          next: { revalidate: 0 }
        })
        
        if (docDetailRes.ok) {
          const detail = await docDetailRes.json()
          allDocsWithDetails.push(detail)
        }
      }

      if (results.length === 0) hasMore = false
      else {
        page++
        if (page > 60) hasMore = false 
      }
    }

    // 2. Análise de Frequência para identificar administradores/testemunhas
    const nameFrequency = new Map<string, number>()
    allDocsWithDetails.forEach(doc => {
      doc.signers.forEach(s => {
        const n = (s.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
        nameFrequency.set(n, (nameFrequency.get(n) || 0) + 1)
      })
    })

    // 3. Extração com Ranking
    const newAssociates: AssociadoInput[] = []
    
    for (const doc of allDocsWithDetails) {
      const sysStatus = (doc.status === 'signed' || doc.status === 'completed') ? 'ativo' : 'pendente'
      
      const rankedSigners = doc.signers.map(s => {
        let score = 100
        const nameRaw = (s.name || '')
        const n = nameRaw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
        const freq = nameFrequency.get(n) || 0
        
        score -= (freq * 10) 
        
        // Penaliza administradores e diretores
        const adminKeywords = ['acprobec', 'leandro xavier', 'antonio pereira', 'diretor', 'secretario', 'testemunha']
        if (adminKeywords.some(kw => n.includes(kw))) score -= 500
        if (s.email === 'acprobec@gmail.com') score -= 1000

        return { signer: s, score }
      })

      rankedSigners.sort((a, b) => b.score - a.score)
      const primarySigner = rankedSigners[0]?.signer

      if (primarySigner) {
        const signer = primarySigner
        const foundCpf = (signer as any).cpf || (signer as any).cnpj || (signer as any).gov_id || (signer as any).external_id || ''
        const cleanedCpf = foundCpf.replace(/\D/g, '')

        const emailKey = signer.email ? signer.email.toLowerCase().trim() : ''
        const nameSlug = signer.name.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .trim()

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
          codigo: stableKey,
          zapsign_doc_token: doc.token,
          zapsign_signers: doc.signers
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

/**
 * Recupera o link temporário do PDF assinado na ZapSign
 */
export async function fetchZapSignSignedFileAction(apiToken: string, docToken: string) {
  if (!docToken) return { error: 'Token do documento não encontrado.' }
  try {
    const res = await fetch(`${ZAPSIGN_API_BASE}/docs/${docToken}/`, {
      headers: { 'Authorization': `Bearer ${apiToken}` },
      next: { revalidate: 0 }
    })
    
    if (!res.ok) throw new Error('Falha ao comunicar com ZapSign')
    
    const data = await res.json()
    return { url: data.signed_file }
  } catch (err: any) {
    return { error: err.message || 'Erro ao buscar download.' }
  }
}

/**
 * FUNÇÃO DE MANUTENÇÃO TEMPORÁRIA
 * Resolve o problema de 'não puxar' o token do ZapSign
 */
export async function tempFixDatabaseAction() {
  const { createServerSupabase } = await import('@/lib/supabase/server')
  const sb = await createServerSupabase()
  
  const sql = `
    -- 1. Garantir Coluna
    ALTER TABLE associados ADD COLUMN IF NOT EXISTS zapsign_doc_token TEXT;

    -- 2. Redefinir Função de Upsert para aceitar o NOVO CAMPO
    CREATE OR REPLACE FUNCTION upsert_associados_safe(rows JSONB)
    RETURNS VOID AS $$
    BEGIN
      INSERT INTO associados (
        tenant_id, codigo, nome, cpf, categoria, email, telefone, 
        data_ingresso, mensalidade, status, zapsign_doc_token
      )
      SELECT 
        (r->>'tenant_id')::UUID,
        r->>'codigo',
        r->>'nome',
        r->>'cpf',
        r->>'categoria',
        r->>'email',
        r->>'telefone',
        (r->>'data_ingresso')::DATE,
        (r->>'mensalidade')::NUMERIC,
        r->>'status',
        r->>'zapsign_doc_token'
      FROM jsonb_array_elements(rows) AS r
      ON CONFLICT (tenant_id, codigo) 
      DO UPDATE SET
        nome = EXCLUDED.nome,
        cpf = COALESCE(EXCLUDED.cpf, associados.cpf),
        email = COALESCE(EXCLUDED.email, associados.email),
        telefone = COALESCE(EXCLUDED.telefone, associados.telefone),
        status = EXCLUDED.status,
        zapsign_doc_token = COALESCE(EXCLUDED.zapsign_doc_token, associados.zapsign_doc_token),
        updated_at = NOW();
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `

  // Tenta executar via RPC genérico se existir, ou via manipulação direta se o client permitir
  return await sb.rpc('execute_sql', { sql })
}
