import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

async function fixDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('--- Iniciando Manutenção do Banco de Dados ---')

  // 1. Adicionar Coluna
  console.log('1. Verificando coluna zapsign_doc_token...')
  const { error: colErr } = await supabase.rpc('execute_sql', { 
    sql: 'ALTER TABLE associados ADD COLUMN IF NOT EXISTS zapsign_doc_token TEXT;' 
  })
  if (colErr) console.log('Aviso (coluna):', colErr.message)

  // 2. Redefinir RPC
  console.log('2. Atualizando função upsert_associados_safe...')
  const sql = `
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
  
  const { error: rpcErr } = await supabase.rpc('execute_sql', { sql })
  if (rpcErr) {
    console.error('Erro ao atualizar RPC:', rpcErr)
  } else {
    console.log('Sucesso! Função upsert_associados_safe atualizada.')
  }

  console.log('--- Manutenção Concluída ---')
}

fixDatabase()
