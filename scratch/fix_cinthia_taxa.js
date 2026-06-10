// fix_cinthia_taxa.js
// Localiza e corrige o lançamento de Cinthia Rejane (Mar/2026) de R$50 para R$51,18

const fs = require('fs'), path = require('path')
const { createClient } = require('@supabase/supabase-js')

function loadEnv(f) {
  fs.readFileSync(f,'utf8').split('\n').forEach(line => {
    const t = line.trim(); if (!t || t.startsWith('#')) return
    const i = t.indexOf('='); if (i<0) return
    const k = t.substring(0,i).trim(); let v = t.substring(i+1).trim()
    if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1)
    process.env[k]=v
  })
}
loadEnv(path.join(__dirname,'..', '.env'))
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  // Busca todos os lançamentos de março com "cinthia" ou "cintia" na descrição
  const { data, error } = await sb
    .from('lancamentos')
    .select('id, descricao, valor, data, data_conciliacao, conciliado, status, tipo, conta_id, banco_transacao_id')
    .ilike('descricao', '%cinth%')
    .order('data')

  if (error) { console.error(error); return }

  console.log('=== LANÇAMENTOS DE CINTHIA/CINTIA ===')
  data?.forEach(l => {
    console.log(`\nID: ${l.id}`)
    console.log(`  Desc: ${(l.descricao||'').substring(0,80)}`)
    console.log(`  Valor: ${l.valor} | Data: ${l.data} | DataConc: ${l.data_conciliacao}`)
    console.log(`  Status: ${l.status} | Conciliado: ${l.conciliado} | Tipo: ${l.tipo}`)
    console.log(`  Conta: ${l.conta_id} | BancoTxID: ${l.banco_transacao_id}`)
  })

  // Identifica o lançamento de março com valor=50 (o que precisa ser corrigido para 51.18)
  const lancMarco50 = data?.find(l => {
    const dataStr = l.data || ''
    const isMarco = dataStr.includes('2026-03') || (l.data_conciliacao || '').includes('2026-03')
    return isMarco && Math.abs(Number(l.valor) - 50) < 0.01
  })

  // Identifica o lançamento com valor=51.18
  const lanc5118 = data?.find(l => Math.abs(Number(l.valor) - 51.18) < 0.01)

  console.log('\n=== ANÁLISE ===')
  if (lancMarco50) {
    console.log(`\nLançamento de MARÇO (R$ 50) encontrado:`)
    console.log(`  ID: ${lancMarco50.id}`)
    console.log(`  Data: ${lancMarco50.data} | DataConc: ${lancMarco50.data_conciliacao}`)
  } else {
    console.log('Lançamento de março com R$50 NÃO encontrado')
  }

  if (lanc5118) {
    console.log(`\nLançamento de R$ 51,18 encontrado:`)
    console.log(`  ID: ${lanc5118.id}`)
    console.log(`  Data: ${lanc5118.data} | DataConc: ${lanc5118.data_conciliacao}`)
  }

  // Se encontrou o de março com R$50, corrige para R$51.18
  if (lancMarco50) {
    console.log(`\n[APLICANDO CORREÇÃO] Atualizando ${lancMarco50.id} de R$${lancMarco50.valor} para R$51.18...`)
    const { error: errUpd } = await sb
      .from('lancamentos')
      .update({ valor: 51.18 })
      .eq('id', lancMarco50.id)

    if (errUpd) {
      console.error('ERRO:', errUpd.message)
    } else {
      console.log('✓ Lançamento atualizado para R$ 51,18')
    }
  }

  // Também verifica se o banco_transacao vinculado tem o valor certo
  if (lancMarco50?.banco_transacao_id) {
    const { data: tx } = await sb
      .from('banco_transacoes')
      .select('id, valor, descricao, data')
      .eq('id', lancMarco50.banco_transacao_id)
      .maybeSingle()
    if (tx) {
      console.log(`\nTransação bancária vinculada: R$ ${tx.valor} em ${tx.data}`)
    }
  }
}

main().catch(console.error)
