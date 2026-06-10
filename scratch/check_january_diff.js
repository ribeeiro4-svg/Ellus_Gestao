
const { createClient } = require('@supabase/supabase-client');

const supabaseUrl = 'https://ukfgrjcflhlgeuarxtmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJanuary() {
  const { data: lancamentos, error } = await supabase
    .from('financeiro')
    .select('*');

  if (error) {
    console.error(error);
    return;
  }

  console.log('--- Transactions for January 2026 (Competence vs Cash) ---');
  lancamentos.filter(l => {
    const d = new Date(l.data);
    const dc = l.data_conciliacao ? new Date(l.data_conciliacao) : null;
    
    // Competence in January
    const compJan = d.getFullYear() === 2026 && d.getMonth() === 0;
    // Cash in January
    const cashJan = dc && dc.getFullYear() === 2026 && dc.getMonth() === 0;
    
    return compJan || cashJan;
  }).forEach(l => {
    const d = new Date(l.data);
    const dc = l.data_conciliacao ? new Date(l.data_conciliacao) : null;
    const compJan = d.getFullYear() === 2026 && d.getMonth() === 0;
    const cashJan = dc && dc.getFullYear() === 2026 && dc.getMonth() === 0;

    console.log(`${l.data} | ${l.descricao.substring(0, 30)} | Valor: ${l.valor} | Tipo: ${l.tipo} | Conciliado: ${l.conciliado} | Pagto: ${l.data_conciliacao} | CompJan: ${compJan} | CashJan: ${cashJan}`);
  });
}

checkJanuary();
