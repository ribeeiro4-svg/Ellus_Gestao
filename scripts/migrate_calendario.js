const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function getEnv(key) {
  try {
    const content = fs.readFileSync('.env.local', 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith(key + '=')) {
        return line.split('=')[1].trim().replace(/^"|"$/g, '');
      }
    }
  } catch (e) {}
  return null;
}

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const sb = createClient(url, key);

const sql = `
CREATE TABLE IF NOT EXISTS conciliacao_calendario_dias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  conta_id UUID NOT NULL,
  data DATE NOT NULL,
  primeira_conciliacao_em TIMESTAMPTZ,
  notas JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, conta_id, data)
);

CREATE INDEX IF NOT EXISTS idx_cal_dias_tenant_data ON conciliacao_calendario_dias(tenant_id, data);
ALTER TABLE conciliacao_calendario_dias DISABLE ROW LEVEL SECURITY;
`;

async function main() {
  console.log('Executando migration do calendário...');
  let { error, data } = await sb.rpc('execute_sql', { sql: sql });
  if (error) {
    console.error('Erro:', error);
  } else {
    console.log('Sucesso!', data);
  }
}

main();
