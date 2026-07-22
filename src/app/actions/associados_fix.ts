'use server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Função para adicionar colunas de recorrência na tabela de associados
 */
export async function fixAssociadosRecorrenciaColumnsAction() {
  const sb = await createServerSupabase()
  
  const sql = `
    -- Adicionar colunas se não existirem
    ALTER TABLE associados ADD COLUMN IF NOT EXISTS recorrencia_ativa BOOLEAN DEFAULT FALSE;
    ALTER TABLE associados ADD COLUMN IF NOT EXISTS conta_recorrencia TEXT;
    ALTER TABLE associados ADD COLUMN IF NOT EXISTS plano_saude TEXT DEFAULT 'Não Possui';
    ALTER TABLE associados ADD COLUMN IF NOT EXISTS termo_status TEXT;
    ALTER TABLE associados ADD COLUMN IF NOT EXISTS zapsign_sync_at TIMESTAMPTZ;
    ALTER TABLE associados ADD COLUMN IF NOT EXISTS data_assinatura DATE;

    -- Retrofit: Se o associado veio do ZapSign mas não tem data de sincronização, usa a data de criação
    UPDATE associados 
    SET zapsign_sync_at = created_at 
    WHERE zapsign_sync_at IS NULL 
    AND (categoria ILIKE '%zapsign%' OR zapsign_doc_token IS NOT NULL);

    -- Retrofit: Populando data_assinatura com data_ingresso para quem já existe da ZapSign
    UPDATE associados
    SET data_assinatura = data_ingresso::DATE
    WHERE data_assinatura IS NULL 
    AND (categoria ILIKE '%zapsign%' OR zapsign_doc_token IS NOT NULL);

    -- Comentários para documentação
    COMMENT ON COLUMN associados.recorrencia_ativa IS 'Indica se o associado está na cobrança recorrente';
    COMMENT ON COLUMN associados.conta_recorrencia IS 'Informa a conta bancária onde a recorrência está ativa';
    COMMENT ON COLUMN associados.plano_saude IS 'Status do plano de saúde (Ativo, Aguardando Declaração, Não Possui)';
    COMMENT ON COLUMN associados.termo_status IS 'Status do Termo Assinado (Enviado ao HGU, Assinatura Pendente)';
    COMMENT ON COLUMN associados.data_assinatura IS 'Data em que o associado assinou o documento na ZapSign';
  `

  // Executa via RPC execute_sql (deve estar configurado no Supabase)
  try {
    const { error } = await sb.rpc('execute_sql', { sql })
    if (error) {
      console.error('Erro ao executar SQL:', error)
      return { error: error.message }
    }
    return { success: true }
  } catch (err: any) {
    console.error('Falha fatal ao fixar colunas:', err)
    return { error: err.message }
  }
}

/**
 * Função para corrigir descrições de mensalidades que foram geradas com o padrão incorreto
 */
export async function fixMonthlyFeeDescriptionsAction(tenantId: string) {
  const sb = await createServerSupabase()
  
  // 1. Buscar todos os lançamentos que contêm uma barra (indicativo de data na descrição)
  // Usamos paginação para garantir que pegamos tudo
  let allLancamentos: { id: string, descricao: string }[] = []
  let from = 0
  const step = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await sb
      .from('lancamentos')
      .select('id, descricao')
      .eq('tipo', 'receita')
      .eq('tenant_id', tenantId)
      .ilike('descricao', '%/%')
      .range(from, from + step - 1)

    if (error) return { error: error.message }
    if (!data || data.length === 0) {
      hasMore = false
    } else {
      allLancamentos = [...allLancamentos, ...data]
      if (data.length < step) hasMore = false
      else from += step
    }
  }

  if (allLancamentos.length === 0) return { message: 'Nenhuma descrição com data (/) foi encontrada para este período.' }

  const toUpdate: { id: string, descricao: string }[] = []
  
  allLancamentos.forEach(l => {
    const desc = (l.descricao || '').trim()
    
    // Regex super flexível para capturar: PARTE1 - DATA - PARTE2
    // Agora aceita tanto hífens com espaços quanto hífens simples
    const match = desc.match(/^(.+?)\s*-\s*.*?\d{2,4}.*?\s*-\s*(.+)$/i)
    
    if (match) {
      let base = match[1].trim()
      const nome = match[2].trim()
      
      // Padronização solicitada pelo usuário
      // Se a base for "LANCAMENTO", "MENSALIDADE" ou similar, converte para o padrão longo
      if (base.toUpperCase() === 'LANCAMENTO' || base.toUpperCase() === 'MENSALIDADE') {
        base = 'MENSALIDADE DE ASSOCIADO'
      }
      
      const novaDescricao = `${base} - ${nome}`.toUpperCase()
      
      if (novaDescricao !== desc.toUpperCase()) {
        toUpdate.push({ id: l.id, descricao: novaDescricao })
      }
    }
  })

  if (toUpdate.length === 0) {
    return { 
      message: `Análise concluída. Foram analisados ${allLancamentos.length} lançamentos com '/', mas nenhum precisava de correção no padrão (BASE - DATA - NOME).`,
    }
  }

  // 2. Atualizar em lotes de 50 para evitar timeout
  let successCount = 0
  for (const item of toUpdate) {
    const { error } = await sb.from('lancamentos').update({ descricao: item.descricao }).eq('id', item.id)
    if (!error) successCount++
  }

  return { 
    message: `Sucesso! ${successCount} lançamentos foram padronizados para: MENSALIDADE DE ASSOCIADO - [NOME].`,
    count: successCount
  }
}

/**
 * Remove a restrição de check constraint no campo vencimento_dia
 */
export async function fixVencimentoConstraintAction() {
  const sb = await createServerSupabase()
  
  const sql = `
    -- 1. Remove a restrição antiga (fixa de 10/20)
    ALTER TABLE associados DROP CONSTRAINT IF EXISTS check_vencimento_dia;
    
    -- 2. Adiciona a nova restrição flexível apenas se ela ainda não existir
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_vencimento_dia_flex') THEN
        ALTER TABLE associados ADD CONSTRAINT check_vencimento_dia_flex CHECK (vencimento_dia >= 1 AND vencimento_dia <= 31);
      END IF;
    END $$;

    -- 3. Recarrega o cache do PostgREST apenas para garantir sincronia
    NOTIFY pgrst, 'reload schema';
  `

  try {
    const { error } = await sb.rpc('execute_sql', { sql })
    if (error) {
      console.error('Erro ao executar SQL:', error)
      return { error: error.message }
    }
    return { success: true }
  } catch (err: any) {
    console.error('Falha fatal ao fixar restrição:', err)
    return { error: err.message }
  }
}

/**
 * Função para adicionar colunas de abono na tabela de associados
 */
export async function fixAssociadosAbonoColumnsAction() {
  const sb = await createServerSupabase()
  
  const sql = `
    -- Adicionar colunas se não existirem
    ALTER TABLE associados ADD COLUMN IF NOT EXISTS abono_motivo TEXT;
    ALTER TABLE associados ADD COLUMN IF NOT EXISTS abono_usuario TEXT;

    -- Comentários para documentação
    COMMENT ON COLUMN associados.abono_motivo IS 'Motivo pelo qual o associado foi abonado (01, 02 ou 03)';
    COMMENT ON COLUMN associados.abono_usuario IS 'Usuário que realizou o abono';
    
    -- Recarrega o cache do PostgREST
    NOTIFY pgrst, 'reload schema';
  `

  try {
    const { error } = await sb.rpc('execute_sql', { sql })
    if (error) {
      console.error('Erro ao executar SQL abono:', error)
      return { error: error.message }
    }
    return { success: true }
  } catch (err: any) {
    console.error('Falha fatal ao fixar colunas de abono:', err)
    return { error: err.message }
  }
}
