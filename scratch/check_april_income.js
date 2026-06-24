const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ukfgrjcflhlgeuarxtmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkApril() {
  try {
    // Get all accounts to identify Cora and Caixa
    const { data: accounts } = await supabase.from('contas').select('id, nome');
    const coraId = accounts.find(c => c.nome.toLowerCase().includes('cora'))?.id;
    const caixaId = accounts.find(c => c.nome.toLowerCase().includes('especie'))?.id;

    console.log(`Cora ID: ${coraId}, Caixa ID: ${caixaId}`);

    // Get all income launches in April 2026
    const { data: lances, error } = await supabase
      .from('lancamentos')
      .select('id, valor, conta_id, descricao, status, data, data_conciliacao')
      .eq('tipo', 'receita')
      .gte('data', '2026-04-01')
      .lte('data', '2026-04-30');

    if (error) throw error;

    let coraTotal = 0;
    let caixaTotal = 0;
    let otherTotal = 0;

    lances.forEach(l => {
        // We need to simulate the "Regime de Caixa" logic if possible, 
        // but let's first look at all income in April.
        if (l.conta_id === coraId) coraTotal += (l.valor || 0);
        else if (l.conta_id === caixaId) caixaTotal += (l.valor || 0);
        else otherTotal += (l.valor || 0);
    });

    console.log(`\n--- ALL INCOME IN APRIL (By ACCRUAL DATE) ---`);
    console.log(`Cora: R$ ${coraTotal.toFixed(2)}`);
    console.log(`Caixa: R$ ${caixaTotal.toFixed(2)}`);
    console.log(`Other: R$ ${otherTotal.toFixed(2)}`);
    console.log(`Total: R$ ${(coraTotal + caixaTotal + otherTotal).toFixed(2)}`);

    // Check PAID income in April (Regime de Caixa)
    // In our code: dateToUse = (item.status === 'pago' && item.data_conciliacao) ? item.data_conciliacao : item.data;
    
    let coraPaid = 0;
    let caixaPaid = 0;
    
    lances.forEach(l => {
        const dateToUse = (l.status === 'pago' && l.data_conciliacao) ? l.data_conciliacao.split('T')[0] : l.data;
        if (dateToUse >= '2026-04-01' && dateToUse <= '2026-04-30') {
            if (l.conta_id === coraId) coraPaid += (l.valor || 0);
            else if (l.conta_id === caixaId) caixaPaid += (l.valor || 0);
        }
    });

    console.log(`\n--- PAID INCOME IN APRIL (Regime de Caixa) ---`);
    console.log(`Cora: R$ ${coraPaid.toFixed(2)}`);
    console.log(`Caixa: R$ ${caixaPaid.toFixed(2)}`);
    console.log(`Total: R$ ${(coraPaid + caixaPaid).toFixed(2)}`);

    // Find if there are any R$ 200 or R$ 1000 differences
    // Maybe some Cora launches are not marked as Cora?
    
  } catch (err) {
    console.error(err);
  }
}

checkApril();
