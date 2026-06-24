// fix_ec_data_conciliacao.js
// Corrige lançamentos EC (is_ec_destino=true) que têm conciliado=true mas data_conciliacao=null
// Lê .env.local manualmente sem depender do pacote dotenv

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Lê .env.local manualmente
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error('Arquivo não encontrado:', filePath)
    process.exit(1)
  }
  const content = fs.readFileSync(filePath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.substring(0, idx).trim()
    let val = trimmed.substring(idx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    process.env[key] = val
  }
}

loadEnv(path.join(__dirname, '..', '.env'))

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERRO: Variáveis NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas no .env.local')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY)

async function main() {
  console.log('=== CORREÇÃO: EC sem data_conciliacao ===\n')

  // 1. Buscar todos os EC-destino que são conciliados mas sem data_conciliacao
  const { data: ecSemData, error: e1 } = await sb
    .from('lancamentos')
    .select('id, descricao, valor, data, conciliado, data_conciliacao, id_origem, is_ec_destino')
    .eq('is_ec_destino', true)
    .eq('conciliado', true)
    .is('data_conciliacao', null)

  if (e1) { console.error('Erro ao buscar ECs:', e1); return }
  
  console.log(`Encontrados ${ecSemData?.length || 0} ECs conciliados sem data_conciliacao:`)
  if (!ecSemData?.length) {
    console.log('Nenhum registro para corrigir!')
    return
  }

  ecSemData.forEach(l => {
    console.log(`  ID: ${l.id} | Valor: ${l.valor} | Data: ${l.data} | id_origem: ${l.id_origem || 'NULL'} | Desc: ${(l.descricao||'').substring(0, 60)}`)
  })

  // 2. Para cada um, buscar a data_conciliacao do lançamento de origem
  let corrigidos = 0

  for (const ec of ecSemData) {
    let dataConc = null

    if (ec.id_origem) {
      const { data: origem, error: e2 } = await sb
        .from('lancamentos')
        .select('id, data_conciliacao, data, conciliado')
        .eq('id', ec.id_origem)
        .maybeSingle()

      if (!e2 && origem) {
        dataConc = origem.data_conciliacao || origem.data
        console.log(`\nEC ${ec.id} -> Origem ${origem.id}: usando data_conciliacao=${dataConc}`)
      } else {
        console.log(`\n[AVISO] Origem não encontrada para EC ${ec.id} (id_origem: ${ec.id_origem}) — usando data própria: ${ec.data}`)
        dataConc = ec.data
      }
    } else {
      console.log(`\n[AVISO] EC ${ec.id} sem id_origem — usando data própria: ${ec.data}`)
      dataConc = ec.data
    }

    const { error: errUpd } = await sb
      .from('lancamentos')
      .update({ data_conciliacao: dataConc })
      .eq('id', ec.id)

    if (errUpd) {
      console.error(`  ERRO ao atualizar ${ec.id}:`, errUpd.message)
    } else {
      console.log(`  ✓ data_conciliacao definida para: ${dataConc}`)
      corrigidos++
    }
  }

  console.log(`\n=== RESULTADO ===`)
  console.log(`Total ECs processados: ${ecSemData.length}`)
  console.log(`Corrigidos com sucesso: ${corrigidos}`)
  
  // 3. Verificação final
  console.log('\n=== VERIFICAÇÃO: Recebimentos Março 2026 (todas as contas, Regime de Caixa) ===')
  const { data: marco, error: e3 } = await sb
    .from('lancamentos')
    .select('id, valor, data, data_conciliacao, conciliado, is_ec_destino, tipo, conta_id')
    .eq('tipo', 'receita')
    .gte('data_conciliacao', '2026-03-01')
    .lte('data_conciliacao', '2026-03-31')
    .eq('conciliado', true)

  if (!e3 && marco) {
    const soma = marco.reduce((acc, l) => acc + Math.abs(Number(l.valor)), 0)
    console.log(`Total recebimentos março (Regime de Caixa): R$ ${soma.toFixed(2).replace('.', ',')}`)
    console.log(`Quantidade de lançamentos: ${marco.length}`)
    console.log('\nDetalhes:')
    marco.forEach(l => {
      const ecTag = l.is_ec_destino ? ' [EC]' : ''
      console.log(`  ${l.id.substring(0,8)} | ${l.data_conciliacao} | R$ ${Number(l.valor).toFixed(2)} | conta: ${(l.conta_id||'').substring(0,8)}${ecTag}`)
    })
  } else if (e3) {
    console.error('Erro na verificação:', e3)
  }
}

main().catch(console.error)
