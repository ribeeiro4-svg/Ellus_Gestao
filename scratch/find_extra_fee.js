const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ukfgrjcflhlgeuarxtmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findExtraFee() {
  try {
    // Get all active associates
    const { data: activeAssociates, error: errAssoc } = await supabase
      .from('associados')
      .select('id, nome')
      .eq('status', 'Ativo');

    if (errAssoc) throw errAssoc;

    console.log(`Found ${activeAssociates.length} active associates.`);

    // Get all monthly fees for June 2026
    const { data: fees, error: errFees } = await supabase
      .from('lancamentos')
      .select('id, descricao, valor, associado_id, categoria, status')
      .eq('tipo', 'receita')
      // .eq('status', 'aberto') // The user sees R$ 12.700,00 total for June, maybe it includes others?
      .gte('data', '2026-06-01')
      .lte('data', '2026-06-30')
      .ilike('categoria', '%Mensalidade%');

    if (errFees) throw errFees;

    console.log(`Found ${fees.length} monthly fees in June 2026.`);

    const totalValue = fees.reduce((acc, f) => acc + (f.valor || 0), 0);
    console.log(`Total Value: R$ ${totalValue.toFixed(2)}`);

    // Find fees for NON-ACTIVE associates
    const feesForNonActive = [];
    for (const fee of fees) {
      if (!fee.associado_id) {
          feesForNonActive.push({ ...fee, reason: 'No associate linked' });
          continue;
      }
      const isActive = activeAssociates.some(a => a.id === fee.associado_id);
      if (!isActive) {
          // Find associate name
          const { data: assoc } = await supabase.from('associados').select('nome, status').eq('id', fee.associado_id).single();
          feesForNonActive.push({ ...fee, assocName: assoc?.nome, assocStatus: assoc?.status, reason: 'Associate not active' });
      }
    }

    // Find duplicate fees for same associate
    const duplicateFees = [];
    const seenIds = new Set();
    const duplicateIds = new Set();
    fees.forEach(f => {
      if (f.associado_id) {
          if (seenIds.has(f.associado_id)) {
              duplicateIds.add(f.associado_id);
          }
          seenIds.add(f.associado_id);
      }
    });

    for (const id of duplicateIds) {
      const assocFees = fees.filter(f => f.associado_id === id);
      const { data: assoc } = await supabase.from('associados').select('nome').eq('id', id).single();
      duplicateFees.push({ assocName: assoc?.nome, fees: assocFees });
    }

    console.log('\n--- Fees for Non-Active Associates ---');
    console.log(JSON.stringify(feesForNonActive, null, 2));

    console.log('\n--- Duplicate Fees ---');
    console.log(JSON.stringify(duplicateFees, null, 2));

    // Also look for ANY other income in June that is not a monthly fee but might be R$ 50
    const { data: otherIncomes } = await supabase
      .from('lancamentos')
      .select('id, descricao, valor, categoria, status')
      .eq('tipo', 'receita')
      .gte('data', '2026-06-01')
      .lte('data', '2026-06-30')
      .not('categoria', 'ilike', '%Mensalidade%');

    console.log('\n--- Other Incomes in June 2026 ---');
    console.log(JSON.stringify(otherIncomes, null, 2));

  } catch (err) {
    console.error(err);
  }
}

findExtraFee();
