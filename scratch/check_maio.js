require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sb = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: associados } = await sb.from('associados').select('id, nome, status, data_filiacao');
  const { data: lancamentos } = await sb.from('lancamentos')
    .select('id, associado_id, data')
    .gte('data', '2026-05-01')
    .lte('data', '2026-05-31');

  const lancados = new Set(lancamentos.filter(l => l.associado_id).map(l => l.associado_id));
  
  let semMaio = 0;
  let ativosSemMaio = 0;
  associados.forEach(a => {
    if (!lancados.has(a.id)) {
      semMaio++;
      if (a.status === 'ativo' || a.status === 'pendente') {
         ativosSemMaio++;
      }
    }
  });

  console.log(`Total Associados: ${associados.length}`);
  console.log(`Lancamentos em Maio com Associado: ${lancamentos.length}`);
  console.log(`Associados sem lancamento em Maio: ${semMaio}`);
  console.log(`Associados ATIVOS/PENDENTES sem lancamento em Maio: ${ativosSemMaio}`);
}
run();
