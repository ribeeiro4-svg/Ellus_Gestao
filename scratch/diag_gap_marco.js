// diag_gap_marco.js
// Investiga a diferença de R$ 201,18 entre extrato bancário e financeiro em Março 2026

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) { console.error('Arquivo não encontrado:', filePath); process.exit(1) }
  const content = fs.readFileSync(filePath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.substring(0, idx).trim()
    let val = trimmed.substring(idx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
    process.env[key] = val
  }
}
loadEnv(path.join(__dirname, '..', '.env'))
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const MARCO_START = '2026-03-01'
const MARCO_END   = '2026-03-31'

async function main() {
  // ── 1. Todas as contas Cora PJ ──────────────────────────────────────────
  const { data: contas } = await sb.from('contas_bancarias').select('id, nome, banco')
  console.log('=== CONTAS BANCÁRIAS ===')
  contas?.forEach(c => console.log(`  ${c.id} | ${c.nome} | ${c.banco}`))

  // ── 2. Extrato bancário de março (banco_transacoes) ─────────────────────
  const { data: extrato, error: eExt } = await sb
    .from('banco_transacoes')
    .select('id, data, valor, descricao, tipo, conciliado, lancamento_id, conta_id')
    .gte('data', MARCO_START)
    .lte('data', MARCO_END)
    .order('data')

  if (eExt) { console.error('Erro ao buscar extrato:', eExt); return }

  const extratoCreditos = (extrato || []).filter(t => Number(t.valor) > 0)
  const somaExtrato = extratoCreditos.reduce((s, t) => s + Number(t.valor), 0)
  console.log(`\n=== EXTRATO MARÇO (créditos) ===`)
  console.log(`Total créditos: R$ ${somaExtrato.toFixed(2)} | Qtd: ${extratoCreditos.length}`)

  // ── 3. Lançamentos financeiro março (Regime de Caixa) ───────────────────
  const { data: lancMarco, error: eLanc } = await sb
    .from('lancamentos')
    .select('id, valor, data, data_conciliacao, conciliado, tipo, status, banco_transacao_id, is_ec_destino, descricao, conta_id')
    .eq('tipo', 'receita')
    .eq('conciliado', true)
    .gte('data_conciliacao', MARCO_START + 'T00:00:00+00:00')
    .lte('data_conciliacao', MARCO_END + 'T23:59:59+00:00')

  if (eLanc) { console.error('Erro ao buscar lançamentos:', eLanc); return }

  const somaFinanceiro = (lancMarco || []).reduce((s, l) => s + Math.abs(Number(l.valor)), 0)
  console.log(`\n=== FINANCEIRO MARÇO (Regime de Caixa) ===`)
  console.log(`Total receitas: R$ ${somaFinanceiro.toFixed(2)} | Qtd: ${lancMarco?.length}`)

  const gap = somaExtrato - somaFinanceiro
  console.log(`\n=== GAP ===`)
  console.log(`Diferença: R$ ${gap.toFixed(2)}`)

  // ── 4. Extrato com conciliado=true mas sem lancamento vinculado ──────────
  const extratoConciliadoSemVinculo = extratoCreditos.filter(t => t.conciliado && !t.lancamento_id)
  console.log(`\n=== EXTRATO conciliado=true mas lancamento_id=null (${extratoConciliadoSemVinculo.length}) ===`)
  extratoConciliadoSemVinculo.forEach(t => {
    console.log(`  ${t.id} | ${t.data} | R$ ${t.valor} | ${(t.descricao||'').substring(0,60)}`)
  })

  // ── 5. Transações do extrato cujo lancamento_id aponta para lançamento que NÃO está em lancMarco ──
  const lancMarcoIds = new Set((lancMarco || []).map(l => l.id))
  const bancTransIds = new Set((lancMarco || []).map(l => l.banco_transacao_id).filter(Boolean))

  const extratoConciliado = extratoCreditos.filter(t => t.conciliado)
  const somaExtratoConciliado = extratoConciliado.reduce((s, t) => s + Number(t.valor), 0)
  console.log(`\n=== EXTRATO conciliado=true ===`)
  console.log(`Total: R$ ${somaExtratoConciliado.toFixed(2)} | Qtd: ${extratoConciliado.length}`)

  // Transações conciliadas no extrato que têm lancamento_id mas esse ID não está no financeiro
  const foraDoFinanceiro = extratoConciliado.filter(t => t.lancamento_id && !lancMarcoIds.has(t.lancamento_id))
  console.log(`\n=== EXTRATO conciliado + lancamento_id vinculado mas FORA do financeiro março (${foraDoFinanceiro.length}) ===`)
  let somaFora = 0
  for (const t of foraDoFinanceiro) {
    somaFora += Number(t.valor)
    // Busca o lançamento correspondente
    const { data: lanc } = await sb.from('lancamentos').select('id, valor, data, data_conciliacao, conciliado, tipo, status, is_ec_destino').eq('id', t.lancamento_id).maybeSingle()
    console.log(`  Transação: ${t.id.substring(0,8)} | ${t.data} | R$ ${t.valor}`)
    if (lanc) {
      console.log(`    -> Lançamento: ${lanc.id.substring(0,8)} | tipo: ${lanc.tipo} | status: ${lanc.status} | conciliado: ${lanc.conciliado} | data_conc: ${lanc.data_conciliacao} | is_ec: ${lanc.is_ec_destino}`)
    } else {
      console.log(`    -> Lançamento ${t.lancamento_id} NÃO ENCONTRADO no banco!`)
    }
  }
  console.log(`  Soma transações fora do financeiro: R$ ${somaFora.toFixed(2)}`)

  // ── 6. Lançamentos vinculados ao extrato de março mas com data_conciliacao FORA de março ──
  console.log(`\n=== LANÇAMENTOS vinculados a transações de março mas data_conciliacao FORA de março ===`)
  let somaDataErrada = 0
  for (const t of extratoConciliado) {
    if (!t.lancamento_id) continue
    if (lancMarcoIds.has(t.lancamento_id)) continue // já está no financeiro
    const { data: lanc } = await sb.from('lancamentos')
      .select('id, valor, data, data_conciliacao, conciliado, tipo, status')
      .eq('id', t.lancamento_id)
      .neq('tipo', 'despesa')
      .maybeSingle()
    if (lanc && lanc.conciliado) {
      somaDataErrada += Math.abs(Number(lanc.valor))
      console.log(`  Transação ${t.id.substring(0,8)} | ${t.data} | R$ ${t.valor}`)
      console.log(`    -> Lançamento ${lanc.id.substring(0,8)} | data_conciliacao: ${lanc.data_conciliacao} | valor: ${lanc.valor}`)
    }
  }
  if (somaDataErrada > 0) console.log(`  Soma: R$ ${somaDataErrada.toFixed(2)}`)

  // ── 7. Lançamentos receita com data_conciliacao null mas banco_transacao_id em março ──────
  console.log(`\n=== LANÇAMENTOS receita conciliado=true mas data_conciliacao=null e banco_transacao em março ===`)
  const { data: semDataConc } = await sb
    .from('lancamentos')
    .select('id, valor, data, data_conciliacao, conciliado, tipo, status, banco_transacao_id, is_ec_destino')
    .eq('tipo', 'receita')
    .eq('conciliado', true)
    .is('data_conciliacao', null)

  let somaSemData = 0
  for (const l of (semDataConc || [])) {
    if (!l.banco_transacao_id) continue
    const transacaoMarco = extrato?.find(t => t.id === l.banco_transacao_id)
    if (transacaoMarco && Number(transacaoMarco.valor) > 0) {
      somaSemData += Math.abs(Number(l.valor))
      console.log(`  Lançamento ${l.id.substring(0,8)} | data: ${l.data} | valor: ${l.valor} | is_ec: ${l.is_ec_destino}`)
      console.log(`    -> Transação ${transacaoMarco.id.substring(0,8)} | ${transacaoMarco.data} | R$ ${transacaoMarco.valor}`)
    }
  }
  if (somaSemData > 0) console.log(`  Soma: R$ ${somaSemData.toFixed(2)}`)
  else console.log('  (nenhum)')
}

main().catch(console.error)
