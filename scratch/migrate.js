const { execSync } = require('child_process');

const sql = `
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS zapsign_token TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cora_id TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cora_cert TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cora_key TEXT;
`;

try {
  console.log('Iniciando migração de colunas...');
  // Tenta rodar via npx supabase
  const cmd = `npx -y supabase db execute "${sql.replace(/\n/g, ' ')}"`;
  const output = execSync(cmd, { encoding: 'utf-8' });
  console.log('Resultado:', output);
} catch (error) {
  console.error('Falha na migração automática:', error.message);
  console.log('\n--- ATENÇÃO BRUNO ---');
  console.log('A política de segurança do seu Windows impediu a criação automática das colunas.');
  console.log('Por favor, acesse o SQL Editor do seu Supabase e cole o seguinte código:');
  console.log(sql);
  console.log('---------------------\n');
}
