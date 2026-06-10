
'use server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function applyFinancialLinkFixAction() {
  const sb = await createServerSupabase()
  
  const sql = `
    -- 1. Coluna de retro-vínculo nas notas
    ALTER TABLE nfe_entradas ADD COLUMN IF NOT EXISTS lancamento_financeiro_id UUID;
    ALTER TABLE nfse_entradas ADD COLUMN IF NOT EXISTS lancamento_financeiro_id UUID;
    
    -- 2. Suporte a NFe (Produtos) na tabela de vínculos
    ALTER TABLE nfse_financeiro_vinculo ADD COLUMN IF NOT EXISTS nfe_id UUID REFERENCES nfe_entradas(id) ON DELETE CASCADE;
    ALTER TABLE nfse_financeiro_vinculo ALTER COLUMN nfse_id DROP NOT NULL;
    ALTER TABLE nfse_financeiro_vinculo DISABLE ROW LEVEL SECURITY;
    
    -- 3. Tabela de Logs da Contabilidade (se não existir)
    CREATE TABLE IF NOT EXISTS contabil_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        acao TEXT NOT NULL,
        detalhes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE contabil_logs DISABLE ROW LEVEL SECURITY;

    -- 3.1 Tabela de Logs do Fiscal (se não existir)
    CREATE TABLE IF NOT EXISTS fiscal_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        acao TEXT NOT NULL,
        detalhes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE fiscal_logs DISABLE ROW LEVEL SECURITY;

    -- 4. Forçar reload do schema
    COMMENT ON TABLE nfe_entradas IS 'Tabela de notas de entrada de produtos - Atualizada';
    NOTIFY pgrst, 'reload schema';
  `

  // Tenta usar o client admin se a chave estiver disponível no servidor
  const sbAdmin = (process.env.SUPABASE_SERVICE_ROLE_KEY) 
    ? require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : sb

  try {
    // Teste simples para ver se o RPC existe e funciona
    const { error: testErr } = await sbAdmin.rpc('execute_sql', { sql: 'SELECT 1' })
    if (testErr) {
      console.error('RPC execute_sql test failed:', testErr)
      // Tenta o outro nome comum
      const { error: testErr2 } = await sbAdmin.rpc('exec_sql', { sql_query: 'SELECT 1' })
      if (testErr2) {
        return { error: `Nenhum dos RPCs de SQL (execute_sql ou exec_sql) foi encontrado ou você não tem permissão. Erro: ${testErr.message}` }
      }
    }

    const { error } = await sbAdmin.rpc('execute_sql', { sql })
    if (error) {
      const { error: error2 } = await sbAdmin.rpc('exec_sql', { sql_query: sql })
      if (error2) return { error: `Erro ao executar SQL de ajuste: ${error2.message}` }
    }
    return { success: true }
  } catch (err: any) {
    return { error: `Erro inesperado: ${err.message}` }
  }
}
