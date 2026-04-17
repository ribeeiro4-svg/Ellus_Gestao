import { CoraService } from '../src/lib/services/coraService';

async function diag() {
  console.log('--- Iniciando Auditoria Cora ---');
  try {
    console.log('Testando obtenção de Token...');
    const token = await CoraService.getToken();
    console.log('Sucesso! Token obtido:', token.substring(0, 10), '...');
    
    console.log('Testando listagem de recorrências...');
    const recs = await CoraService.listRecurrences();
    console.log('Sucesso! Recorrências encontradas:', JSON.stringify(recs, null, 2));
    
  } catch (err: any) {
    console.error('FALHA NA AUDITORIA:');
    console.error('Mensagem:', err.message);
    if (err.stack) console.error('Stack:', err.stack);
  }
}

diag();
