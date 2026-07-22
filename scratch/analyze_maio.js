const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching data...');
  const { data: associados, error: err1 } = await sb.from('associados').select('id, nome, status, created_at, data_assinatura, recorrencia_ativa');
  if (err1) {
    console.error("Erro associados:", err1);
    return;
  }
  
  // Buscar TODOS os lançamentos para ver se têm de adesão, etc.
  const { data: lancamentos, error: err2 } = await sb.from('lancamentos').select('id, associado_id, data, categoria');
  if (err2) {
    console.error("Erro lancamentos:", err2);
    return;
  }

  console.log(`Total de Associados cadastrados: ${associados.length}`);

  const lancamentosMaio = lancamentos.filter(l => l.data >= '2026-05-01' && l.data <= '2026-05-31');
  const associadosComMaio = new Set(lancamentosMaio.filter(l => l.associado_id).map(l => l.associado_id));

  let analise = {
    total_sem_maio: 0,
    entraram_depois: 0,
    recorrencia_inativa: 0,
    apenas_adesao_em_maio: 0,
    sem_explicacao_obvia: 0
  };

  associados.forEach(a => {
    if (!associadosComMaio.has(a.id)) {
      analise.total_sem_maio++;
      
      const joinedDate = a.data_assinatura || a.created_at;
      const isAfterMay = joinedDate && joinedDate >= '2026-06-01';
      
      if (isAfterMay) {
        analise.entraram_depois++;
      } else if (a.status !== 'ativo' || !a.recorrencia_ativa) {
        analise.recorrencia_inativa++;
      } else {
        // Verifica se tem lançamento de adesão em maio (talvez não classificado com data de competência de maio mas sim junho, ou o inverso)
        // Se a data de filiação for em Maio, pode ser que pagou só adesão
        const isFiliadoEmMaio = joinedDate && joinedDate >= '2026-05-01' && joinedDate <= '2026-05-31';
        if (isFiliadoEmMaio) {
            analise.apenas_adesao_em_maio++;
        } else {
            analise.sem_explicacao_obvia++;
        }
      }
    }
  });

  console.log('\n=== RESULTADO DA ANÁLISE ===');
  console.log(`Associados totais sem lançamento em Maio: ${analise.total_sem_maio}`);
  console.log(`- Motivo 1: Entraram depois de Maio (Junho em diante): ${analise.entraram_depois}`);
  console.log(`- Motivo 2: Inativos ou com Recorrência Desativada: ${analise.recorrencia_inativa}`);
  console.log(`- Motivo 3: Entraram em Maio (Provável 1ª mensalidade apenas p/ Junho): ${analise.apenas_adesao_em_maio}`);
  console.log(`- Outros / Falta gerar mensalidade: ${analise.sem_explicacao_obvia}`);
}
run();
