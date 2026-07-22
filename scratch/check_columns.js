
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'tarefas' });
  
  if (error) {
    // Se a RPC não existir, tentamos via query direta (se permitido) ou apenas listando uma linha
    console.log('RPC falhou, tentando buscar uma linha...');
    const { data: rows, error: rowErr } = await supabase.from('tarefas').select('*').limit(1);
    if (rowErr) {
      console.error('Erro ao buscar linha:', rowErr);
    } else {
      console.log('Colunas encontradas na primeira linha:', Object.keys(rows[0] || {}));
    }
    return;
  }

  console.log('Colunas:', data);
}

check();
