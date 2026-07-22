const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = "https://ukfgrjcflhlgeuarxtmt.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc";


const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const data = JSON.parse(fs.readFileSync('lista_imagem.json', 'utf-8'));
  
  // Buscar associados
  const { data: associados, error: assocError } = await supabase.from('associados').select('id, nome, tenant_id');
  if (assocError) {
    console.error('Error fetching associados', assocError);
    return;
  }
  
  const tenantId = associados[0]?.tenant_id;
  
  const results = [];
  
  for (const item of data) {
    // Achar o associado por nome (case insensitive)
    const nomeBusca = item.nome.trim().toLowerCase();
    const associado = associados.find(a => a.nome && a.nome.trim().toLowerCase() === nomeBusca);
    
    if (!associado) {
      results.push(`| ${item.nome} | ${item.data} | ❌ **Associado não encontrado no sistema** | - |`);
      continue;
    }
    
    // Buscar lançamentos do associado próximo a essa data e valor
    const { data: lancs, error: lancError } = await supabase
      .from('lancamentos')
      .select('id, data, valor, status, descricao')
      .eq('associado_id', associado.id)
      .eq('data', item.data);
      
    if (lancError) {
      console.error('Error fetching lancamentos for', item.nome, lancError);
      continue;
    }
    
    if (lancs && lancs.length > 0) {
      // Tem pelo menos 1
      const l = lancs[0];
      let statusStr = l.status;
      let icon = '';
      if (statusStr === 'atrasado') icon = '🔴';
      else if (statusStr === 'pago') icon = '🟢';
      else if (statusStr === 'aberto') icon = '🟡';
      else icon = '⚪';
      
      results.push(`| ${item.nome} | ${item.data} | ${icon} Encontrado (Status: **${statusStr.toUpperCase()}**) | R$ ${l.valor} |`);
    } else {
      // Tentar buscar lançamentos num raio de 5 dias
      const d = new Date(item.data);
      const dStart = new Date(d.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dEnd = new Date(d.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const { data: lancsProx, error: lProxErr } = await supabase
        .from('lancamentos')
        .select('id, data, valor, status, descricao')
        .eq('associado_id', associado.id)
        .gte('data', dStart)
        .lte('data', dEnd);
        
      if (lancsProx && lancsProx.length > 0) {
        const l = lancsProx[0];
        let statusStr = l.status;
        results.push(`| ${item.nome} | ${item.data} | ⚠️ Encontrado data diferente (${l.data}) (Status: **${statusStr.toUpperCase()}**) | R$ ${l.valor} |`);
      } else {
        results.push(`| ${item.nome} | ${item.data} | ❌ **Nenhum lançamento encontrado** para a data ou próximas | - |`);
      }
    }
  }
  
  let md = `# Verificação de Lançamentos Atrasados\n\n`;
  md += `| Nome | Data Solicitada | Resultado da Busca no Sistema | Valor Encontrado |\n`;
  md += `|---|---|---|---|\n`;
  md += results.join('\n');
  
  fs.writeFileSync('analise_imagem.md', md, 'utf-8');
  console.log('Finalizado, salvo em analise_imagem.md');
}

run();
