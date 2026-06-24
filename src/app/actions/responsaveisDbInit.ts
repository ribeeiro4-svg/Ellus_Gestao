'use server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function criarTabelaResponsaveis() {
  const sb = await createServerSupabase()

  // Cria a tabela responsaveis_atendimento se não existir
  const { error: e1 } = await sb.rpc('exec_ddl', {
    query: `
      CREATE TABLE IF NOT EXISTS responsaveis_atendimento (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        nome TEXT NOT NULL,
        telefone TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
  })

  if (e1) {
    console.error('[criarTabelaResponsaveis] Erro RPC:', e1)
    return { ok: false, error: e1.message }
  }

  return { ok: true }
}
