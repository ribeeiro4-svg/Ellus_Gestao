
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Funções copiadas EXATAMENTE do projeto
function getMesIdx(dataStr) {
  if (!dataStr) return -1
  const str = String(dataStr).trim()
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return (parseInt(isoMatch[2], 10) || 0) - 1
  return -1
}

async function simulateDashboard() {
  const { data: lancamentos } = await supabase.from('lancamentos').select('*');
  
  const filterMonth = 3; // Abril
  const filterYear = 2026;
  
  let pInc = 0;
  let pExp = 0;

  lancamentos.forEach(l => {
    const statusLower = (l.status || '').toLowerCase();
    const isRealized = ['pago', 'efetivado', 'concluido', 'recebido', 'sucesso', 'parcial'].includes(statusLower) || !!l.data_conciliacao;
    
    if (!isRealized) return;

    const dateToUse = (isRealized && l.data_conciliacao) ? l.data_conciliacao : l.data;
    const m = getMesIdx(dateToUse);
    const y = new Date(dateToUse).getFullYear();

    if (m === filterMonth && y === filterYear) {
      const match = (l.descricao || '').match(/\(Taxa: R\$\s*([^)]+)\)/);
      const taxaVal = match ? parseFloat(match[1].replace(/\./g, '').replace(',', '.')) : 0;
      const valorComTaxa = Number(l.valor) + (isNaN(taxaVal) ? 0 : taxaVal);

      if (l.tipo === 'receita') {
        pInc += valorComTaxa;
        if (valorComTaxa === 50) {
            console.log(`Item de 50 encontrado: ${l.descricao} - Data: ${l.data} - Concil: ${l.data_conciliacao}`);
        }
      } else {
        pExp += Number(l.valor);
      }
    }
  });

  console.log(`RESULTADO SIMULADO (ABRIL): Entradas: ${pInc.toFixed(2)} - Saídas: ${pExp.toFixed(2)}`);
}

simulateDashboard();
