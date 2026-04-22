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

    -- Comentários para documentação
    COMMENT ON COLUMN associados.recorrencia_ativa IS 'Indica se o associado está na cobrança recorrente';
    COMMENT ON COLUMN associados.conta_recorrencia IS 'Informa a conta bancária onde a recorrência está ativa';
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
