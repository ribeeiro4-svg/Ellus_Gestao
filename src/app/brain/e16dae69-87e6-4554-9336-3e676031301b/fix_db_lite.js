const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

async function fixDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Erro: Variáveis de ambiente não encontradas no .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('--- Iniciando Manutenção (JS) ---');

  const sql = `
    -- 1. Garantir Coluna
    ALTER TABLE associados ADD COLUMN IF NOT EXISTS zapsign_doc_token TEXT;

    -- 2. Redefinir Função
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
  `;

  const { error } = await supabase.rpc('execute_sql', { sql });
  
  if (error) {
    // Se falhar o execute_sql, talvez a função não exista.
    console.error('Erro ao executar SQL via RPC:', error.message);
    console.log('Dica: Verifique se a função execute_sql existe no seu Supabase.');
  } else {
    console.log('Sucesso! Banco de dados atualizado.');
  }

  console.log('--- Fim ---');
}

fixDatabase();
