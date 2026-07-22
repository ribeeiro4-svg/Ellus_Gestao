const fs = require('fs');
const results = JSON.parse(fs.readFileSync('scratch_results.json', 'utf8'));

const notFound = results.filter(r => !r.associado_encontrado).map(r => r.nome);
const foundPaid = results.filter(r => r.associado_encontrado && r.pagos > 0).map(r => `${r.nome} (Pagos: ${r.pagos}, Pix: ${r.pagos_pix})`);
const foundAtrasado = results.filter(r => r.associado_encontrado && r.pendentes_ou_atrasados > 0 && r.pagos === 0).map(r => `${r.nome} (Atrasados: ${r.pendentes_ou_atrasados})`);
const foundNoLancamento = results.filter(r => r.associado_encontrado && r.total_periodo === 0).map(r => r.nome);

console.log('--- NÃO ENCONTRADOS COMO ASSOCIADOS (3) ---');
console.log(notFound.join('\n'));

console.log('\n--- POSSUEM PAGAMENTOS RECENTES NO SISTEMA ---');
console.log(foundPaid.join('\n'));

console.log('\n--- CONSTAM COMO ATRASADOS/PENDENTES NO SISTEMA ---');
console.log(foundAtrasado.join('\n'));

console.log('\n--- ENCONTRADOS, MAS SEM LANÇAMENTOS NO PERÍODO ---');
console.log(foundNoLancamento.join('\n'));
