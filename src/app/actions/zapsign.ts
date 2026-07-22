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
      const docsRes = await fetch(`${ZAPSIGN_API_BASE}/docs/?page=${page}&t=${Date.now()}`, {
        headers: { 
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store',
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
        const docDetailRes = await fetch(`${ZAPSIGN_API_BASE}/docs/${doc.token}?t=${Date.now()}`, {
          headers: { 'Authorization': `Bearer ${apiToken}` },
          cache: 'no-store',
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
        if (page > 100) hasMore = false 
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
      // Status mais flexível para o documento
      const docStatus = (doc.status || '').toLowerCase()
      const isDocSigned = docStatus === 'signed' || docStatus === 'completed' || docStatus === 'assinada' || docStatus === 'finalizada'
      
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
        
        // Se o doc estiver assinado OU o signatário principal tiver assinado
        const isPrimarySigned = !!signer.signed_at || isDocSigned
        const sysStatus = isPrimarySigned ? 'ativo' : 'pendente'

        // Normaliza o status dos signatários para garantir que 'signed_at' reflita no status
        const normalizedSigners = doc.signers.map((s: any) => ({
          ...s,
          status: (s.status === 'signed' || s.signed_at) ? 'signed' : s.status
        }))

        newAssociates.push({
          nome: signer.name,
          email: signer.email || '',
          cpf: cleanedCpf || '',
          telefone: signer.phone_number || '',
          categoria: 'ZapSign',
          mensalidade: 50,
          status: sysStatus,
          data_ingresso: (signer.signed_at ? signer.signed_at.split('T')[0] : undefined) as any,
          codigo: stableKey,
          zapsign_doc_token: doc.token,
          zapsign_signers: normalizedSigners,
          data_assinatura: signer.signed_at ? signer.signed_at.split('T')[0] : undefined
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

    -- 3. Coluna para Histórico Bancário Oculto e Encontro de Contas
    ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS banco_original_memo TEXT;
    ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS is_ec_destino BOOLEAN DEFAULT false;
    ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS id_origem UUID;
    ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS valor_pago_ec NUMERIC(12,2) DEFAULT 0;
    ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS conta_debito_id UUID;
    ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS conta_credito_id UUID;

    -- 4. Tabela de Histórico de Conciliação
    CREATE TABLE IF NOT EXISTS conciliacao_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL,
      data_processamento TIMESTAMP WITH TIME ZONE DEFAULT now(),
      logs JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- 5. Liberar Acesso (Seguindo padrão das outras tabelas)
    ALTER TABLE conciliacao_logs DISABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "conciliacao_logs_tenant" ON conciliacao_logs;

    -- ============================================================
    -- MÓDULO NFS-e (SERVIÇOS TOMADOS) - FASE 1
    -- ============================================================

    -- 6. Atualização de Fornecedores
    ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS is_fornecedor_mercadorias BOOLEAN DEFAULT TRUE;
    ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS is_prestador_servicos BOOLEAN DEFAULT FALSE;
    ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS cnae_principal TEXT;
    ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS inscricao_municipal TEXT;

    -- 7. Mapeamento de Contas por Operação
    CREATE TABLE IF NOT EXISTS fornecedor_conta_contabil_map (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        fornecedor_id UUID NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
        tipo_operacao TEXT NOT NULL CHECK (tipo_operacao IN ('mercadoria', 'servico')),
        conta_contabil_id UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, fornecedor_id, tipo_operacao)
    );
    ALTER TABLE fornecedor_conta_contabil_map ENABLE ROW LEVEL SECURITY;

    -- 8. Tabela de NFS-e
    CREATE TABLE IF NOT EXISTS nfse_entradas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        numero_nfse TEXT NOT NULL,
        codigo_verificacao TEXT,
        chave_nacional TEXT UNIQUE,
        data_emissao TIMESTAMPTZ NOT NULL,
        data_competencia DATE NOT NULL,
        situacao TEXT NOT NULL DEFAULT 'autorizada',
        prestador_id UUID NOT NULL REFERENCES fornecedores(id),
        municipio_prestacao_ibge TEXT,
        municipio_incidencia_ibge TEXT,
        valor_bruto NUMERIC(12,2) NOT NULL DEFAULT 0,
        valor_deducoes NUMERIC(12,2) DEFAULT 0,
        base_calculo NUMERIC(12,2) NOT NULL DEFAULT 0,
        aliquota_iss NUMERIC(5,2),
        valor_iss NUMERIC(12,2) DEFAULT 0,
        iss_retido BOOLEAN DEFAULT FALSE,
        valor_irrf NUMERIC(12,2) DEFAULT 0,
        valor_pis NUMERIC(12,2) DEFAULT 0,
        valor_cofins NUMERIC(12,2) DEFAULT 0,
        valor_csll NUMERIC(12,2) DEFAULT 0,
        valor_pcc_total NUMERIC(12,2) DEFAULT 0,
        valor_liquido NUMERIC(12,2) NOT NULL,
        descricao_servico TEXT,
        codigo_servico_lc116 TEXT,
        codigo_nbs TEXT,
        conta_despesa_id UUID,
        centro_custo_id UUID,
        projeto_id UUID,
        status_escrituracao TEXT NOT NULL DEFAULT 'pendente',
        lancamento_contabil_id UUID,
        xml_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE nfse_entradas ENABLE ROW LEVEL SECURITY;

    -- 9. Detalhamento de Retenções
    CREATE TABLE IF NOT EXISTS nfse_retencoes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        nfse_id UUID NOT NULL REFERENCES nfse_entradas(id) ON DELETE CASCADE,
        tipo_retencao TEXT NOT NULL CHECK (tipo_retencao IN ('IRRF', 'PIS', 'COFINS', 'CSLL', 'PCC', 'ISS')),
        valor NUMERIC(12,2) NOT NULL,
        aliquota NUMERIC(5,2),
        data_vencimento_darf DATE,
        conta_passivo_id UUID,
        status_recolhimento TEXT DEFAULT 'pendente',
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE nfse_retencoes ENABLE ROW LEVEL SECURITY;

    -- 10. Vínculos Financeiros
    CREATE TABLE IF NOT EXISTS nfse_financeiro_vinculo (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        nfse_id UUID NOT NULL REFERENCES nfse_entradas(id) ON DELETE CASCADE,
        transacao_id UUID NOT NULL REFERENCES lancamentos(id) ON DELETE CASCADE,
        tipo_vinculo TEXT DEFAULT 'manual',
        data_vinculo TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(nfse_id, transacao_id)
    );
    ALTER TABLE nfse_financeiro_vinculo ENABLE ROW LEVEL SECURITY;

    -- 11. Motor de Memorização NFS-e
    CREATE TABLE IF NOT EXISTS motor_memorizacao_nfse (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        prestador_id UUID NOT NULL REFERENCES fornecedores(id),
        codigo_servico TEXT NOT NULL,
        conta_contabil_id UUID NOT NULL,
        confianca INTEGER DEFAULT 100,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, prestador_id, codigo_servico)
    );
    ALTER TABLE motor_memorizacao_nfse ENABLE ROW LEVEL SECURITY;

    -- 12. Políticas de RLS
    DO $$ 
    BEGIN
        -- Mapeamento
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fornecedor_conta_contabil_map') THEN
            CREATE POLICY "fornecedor_map_tenant" ON fornecedor_conta_contabil_map FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));
        END IF;
        -- NFSe
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'nfse_entradas') THEN
            CREATE POLICY "nfse_tenant" ON nfse_entradas FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));
        END IF;
        -- Retencoes
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'nfse_retencoes') THEN
            CREATE POLICY "nfse_retencoes_tenant" ON nfse_retencoes FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));
        END IF;
        -- Vinculos
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'nfse_financeiro_vinculo') THEN
            CREATE POLICY "nfse_vinculo_tenant" ON nfse_financeiro_vinculo FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));
        END IF;
        -- Memorizacao
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'motor_memorizacao_nfse') THEN
            CREATE POLICY "nfse_memo_tenant" ON motor_memorizacao_nfse FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));
        END IF;
    END $$;

    -- Forçar recarga do cache do PostgREST
    NOTIFY pgrst, 'reload schema';

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
        zapsign_doc_token = COALESCE(EXCLUDED.zapsign_doc_token, associados.zapsign_doc_token),
        updated_at = NOW();
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `

  // Tenta executar via RPC execute_sql (deve estar configurado no Supabase como SECURITY DEFINER)
  try {
    const { error } = await sb.rpc('execute_sql', { sql })
    if (error) {
      console.error('Erro ao executar tempFixDatabaseAction:', error)
      return { error: error.message }
    }
    return { success: true }
  } catch (err: any) {
    console.error('Falha fatal em tempFixDatabaseAction:', err)
    return { error: err.message }
  }
}

/**
 * Normalização de strings para comparação robusta
 */
function normalizar(str: string): string {
  return (str || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Verifica e lança a ADESÃO financeira para associados ativos vindos do ZapSign
 */
export async function syncAdesaoFinanceiraAction(associados: any[], tenantId: string, previewOnly = false) {
  const { createServerSupabase } = await import('@/lib/supabase/server')
  const sb = await createServerSupabase()

  // 1. Busca lançamentos de ADESÃO existentes para este tenant
  const { data: lancamentosExistentes } = await sb.from('lancamentos')
    .select('associado_id, categoria, descricao')
    .eq('tenant_id', tenantId)
    .or('categoria.ilike.%ADESÃO%,descricao.ilike.%ADESÃO%')

  // Criamos dois sets para busca rápida: por ID e por Nome Normalizado
  const idsComAdesao = new Set<string>()
  const nomesComAdesao = new Set<string>()

  lancamentosExistentes?.forEach(l => {
    if (l.associado_id) idsComAdesao.add(l.associado_id)
    
    // Tenta extrair o nome da descrição (Padrão: "ADESÃO DE ASSOCIADO - NOME")
    if (l.descricao) {
      const partes = l.descricao.split(' - ')
      let nomeExtraido = partes.length > 1 ? partes[1] : l.descricao
      
      // Remove informações extras como [ENCONTRO DE CONTAS]
      nomeExtraido = nomeExtraido.split('[')[0].split('(')[0].trim()
      nomesComAdesao.add(normalizar(nomeExtraido))
    }
  })

  const paraLancamento = []

  for (const assoc of associados) {
    if ((assoc.status || '').toLowerCase() !== 'ativo') continue

    const nomeNorm = normalizar(assoc.nome)
    
    // Verifica se JÁ EXISTE adesão por ID ou por Nome na descrição
    const jaExistePorId = idsComAdesao.has(assoc.id)
    const jaExistePorNome = nomesComAdesao.has(nomeNorm)

    if (!jaExistePorId && !jaExistePorNome) {
      paraLancamento.push({
        tenant_id: tenantId,
        associado_id: assoc.id,
        tipo: 'receita',
        descricao: `ADESÃO DE ASSOCIADO - ${assoc.nome.toUpperCase()}`,
        categoria: 'ADESÃO',
        valor: assoc.mensalidade || 50,
        status: 'aberto',
        data: assoc.data_ingresso || assoc.data_assinatura || new Date().toISOString().split('T')[0],
        forma_pagamento: 'Boleto'
      })
    }
  }

  if (paraLancamento.length > 0) {
    if (previewOnly) {
      return { preview: paraLancamento }
    }

    const { error } = await sb.from('lancamentos').insert(paraLancamento)
    if (error) {
      console.error('[ZapSignAction] Erro ao lançar adesões:', error)
      return { error: 'Erro ao gerar lançamentos de adesão.' }
    }
    return { count: paraLancamento.length }
  }

  return { count: 0, preview: [] }
}

export async function insertLoteLancamentosAction(lancamentos: any[]) {
  if (!lancamentos || lancamentos.length === 0) return { count: 0 }
  const { createServerSupabase } = await import('@/lib/supabase/server')
  const sb = await createServerSupabase()
  const { error } = await sb.from('lancamentos').insert(lancamentos)
  if (error) return { error: error.message }
  return { count: lancamentos.length }
}
