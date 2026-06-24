const url = 'https://ukfgrjcflhlgeuarxtmt.supabase.co/rest/v1';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc';

async function req(path, opts = {}) {
  const res = await fetch(`${url}${path}`, {
    ...opts,
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...opts.headers
    }
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${res.status} - ${txt}`);
  }
  return res.json().catch(() => null);
}

async function main() {
  console.log('Fetching contas...');
  const contas = await req('/contas_bancarias?select=id,tenant_id');
  if (!contas || contas.length === 0) return console.log('No contas');

  const startDate = new Date('2026-01-01T12:00:00Z');
  const endDate = new Date('2026-06-23T12:00:00Z');
  const todosOsDias = [];
  
  let curr = new Date(startDate);
  while (curr <= endDate) {
    todosOsDias.push(curr.toISOString().split('T')[0]);
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  let totalInseridos = 0;

  for (const conta of contas) {
    const { id: contaId, tenant_id: tenantId } = conta;
    
    // get existentes
    const existentesUrl = `/conciliacao_calendario_dias?tenant_id=eq.${tenantId}&conta_id=eq.${contaId}&data=in.(${todosOsDias.join(',')})&select=data`;
    const existentes = await req(existentesUrl);
    
    const existentesDatas = new Set(existentes.map(e => e.data));
    const diasFaltando = todosOsDias.filter(d => !existentesDatas.has(d));
    
    if (diasFaltando.length > 0) {
      console.log(`Processing ${diasFaltando.length} missing days for conta ${contaId}`);
      // get lancamentos
      const lancamentos = await req(`/lancamentos?tenant_id=eq.${tenantId}&conta_id=eq.${contaId}&data=in.(${diasFaltando.join(',')})&select=data`);
      const cora = await req(`/cora_staged?tenant_id=eq.${tenantId}&data=in.(${diasFaltando.join(',')})&select=data`);
      
      const diasComTransacao = new Set([
        ...lancamentos.map(l => l.data),
        ...cora.map(c => c.data)
      ]);
      
      const novosRegistros = diasFaltando.map(d => ({
        tenant_id: tenantId,
        conta_id: contaId,
        data: d,
        primeira_conciliacao_em: new Date().toISOString(),
        conciliado_por_nome: 'Sistema (Correção em Lote)',
        conciliado_por_email: 'sistema@ellus.com',
        periodo_conciliado: '01/01/2026 a 23/06/2026',
        teve_transacoes: diasComTransacao.has(d)
      }));
      
      await req('/conciliacao_calendario_dias', {
        method: 'POST',
        body: JSON.stringify(novosRegistros),
        headers: { 'Prefer': 'return=minimal' }
      });
      totalInseridos += novosRegistros.length;
    }
  }
  
  console.log(`Finished. Inserted ${totalInseridos} days.`);
}

main().catch(console.error);
