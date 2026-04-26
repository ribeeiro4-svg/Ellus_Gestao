
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim();
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  // Pegar um vínculo existente
  const { data: vinculos, error } = await sb
    .from('nfse_financeiro_vinculo')
    .select('*, nfse:nfse_id(numero_nfse), nfe:nfe_id(numero_nf, chave_acesso)')
    .limit(5);

  if (error) {
    console.log('Erro no join:', error.message);
    // Tentar sem join para ver o que tem
    const { data: raw } = await sb.from('nfse_financeiro_vinculo').select('*').limit(5);
    console.log('Dados brutos:', JSON.stringify(raw, null, 2));
  } else {
    console.log('Vínculos com join:', JSON.stringify(vinculos, null, 2));
  }
}

main();
