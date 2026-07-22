/**
 * IMPORTAÇÃO EM LOTE — LANÇAMENTOS ATRASADOS (COM DRY RUN OBRIGATÓRIO)
 * =====================================================================
 *
 * COMO USAR:
 *   1. Edite o arquivo `lancamentos_importar.json` com os dados corretos
 *   2. Execute o DRY RUN para validar:       node scratch_import_atrasados.js
 *   3. Revise o relatório impresso
 *   4. Execute o INSERT real:                node scratch_import_atrasados.js --execute
 *
 * GARANTIAS DE SEGURANÇA:
 *   - Nenhum dado é inserido sem a flag --execute
 *   - Nomes são resolvidos para associado_id antes de qualquer insert
 *   - Nomes sem correspondência no banco BLOQUEIAM a execução (não inserem nada)
 *   - Um backup JSON é salvo após cada execução bem-sucedida
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const SUPABASE_URL    = 'https://ukfgrjcflhlgeuarxtmt.supabase.co'
const SERVICE_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc'
const TENANT_ID       = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
const IS_EXECUTE      = process.argv.includes('--execute')
const DATA_FILE       = path.join(__dirname, 'lancamentos_importar.json')

const sb = createClient(SUPABASE_URL, SERVICE_KEY)

// Normaliza nomes para matching: remove acentos, lowercase, espaços múltiplos
function norm(s) {
  return (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/\s+/g, ' ')
}

// Distância de Levenshtein (fuzzy match)
function levenshtein(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  return dp[m][n]
}

function encontrarAssociado(nomeInput, assocs) {
  const nInput = norm(nomeInput)

  // 1. Exact match
  const exact = assocs.find(a => norm(a.nome) === nInput)
  if (exact) return { assoc: exact, confianca: 'EXATO', score: 0 }

  // 2. Contains match
  const contains = assocs.filter(a => norm(a.nome).includes(nInput) || nInput.includes(norm(a.nome)))
  if (contains.length === 1) return { assoc: contains[0], confianca: 'PARCIAL', score: 1 }

  // 3. Fuzzy match (Levenshtein)
  const scored = assocs.map(a => ({ a, d: levenshtein(nInput, norm(a.nome)) }))
    .sort((x, y) => x.d - y.d)

  if (scored[0].d <= 8) return { assoc: scored[0].a, confianca: scored[0].d <= 3 ? 'FUZZY_ALTO' : 'FUZZY_BAIXO', score: scored[0].d }

  return { assoc: null, confianca: 'NAO_ENCONTRADO', score: 999 }
}

// Converte data DD/MM/YYYY → YYYY-MM-DD
function parseData(d) {
  if (!d) return null
  if (d.includes('-')) return d // já está no formato correto
  const [dd, mm, yyyy] = d.split('/')
  return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`
}

async function main() {
  console.log('='.repeat(70))
  console.log(IS_EXECUTE
    ? '  🔴 MODO EXECUTE — DADOS SERÃO INSERIDOS NO BANCO'
    : '  🟢 MODO DRY RUN — NENHUM DADO SERÁ ALTERADO')
  console.log('='.repeat(70))

  // 1. Ler arquivo de dados
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`❌ Arquivo não encontrado: ${DATA_FILE}`)
    console.error('   Crie o arquivo lancamentos_importar.json com os dados.')
    process.exit(1)
  }
  const lista = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
  console.log(`\n📋 Registros no arquivo: ${lista.length}`)

  // 2. Carregar todos os associados do banco
  const { data: assocs, error: assocErr } = await sb
    .from('associados')
    .select('id, nome, codigo, status')
    .eq('tenant_id', TENANT_ID)
  if (assocErr) { console.error('❌ Erro ao carregar associados:', assocErr.message); process.exit(1) }
  console.log(`📚 Associados no banco: ${assocs.length}`)

  // 3. Resolver cada item da lista
  const resolvidos = []
  const naoEncontrados = []
  const fuzzyBaixos = []

  for (const item of lista) {
    const { assoc, confianca, score } = encontrarAssociado(item.nome, assocs)
    const dataISO = parseData(item.data)
    const [yyyy, mm] = (dataISO || '').split('-')

    const registro = {
      _input_nome: item.nome,
      _confianca: confianca,
      _score: score,
      associado_id: assoc?.id || null,
      _nome_banco: assoc?.nome || null,
      tenant_id: TENANT_ID,
      data: dataISO,
      competencia_mes: mm ? parseInt(mm) : null,
      competencia_ano: yyyy ? parseInt(yyyy) : null,
      descricao: item.descricao || `RECEB. DE MENSALIDADE - ${(item.nome || '').toUpperCase()} [FIXO]`,
      categoria: item.categoria || 'Mensalidades',
      tipo: item.tipo || 'receita',
      valor: parseFloat(item.valor || 50),
      status: 'atrasado',
      conciliado: false,
      banco_transacao_id: null,
    }

    if (confianca === 'NAO_ENCONTRADO') naoEncontrados.push(registro)
    else if (confianca === 'FUZZY_BAIXO')  fuzzyBaixos.push(registro)
    else resolvidos.push(registro)
  }

  // 4. Relatório DRY RUN
  console.log('\n' + '='.repeat(70))
  console.log(`  ✅ RESOLVIDOS (${resolvidos.length}) — serão inseridos`)
  console.log('='.repeat(70))
  resolvidos.forEach((r, i) => {
    const conf = r._confianca === 'EXATO' ? '✅' : r._confianca === 'PARCIAL' ? '🟡' : '🔵'
    console.log(`  ${String(i+1).padStart(3)}. ${conf} [${r._confianca}] "${r._input_nome}"`)
    console.log(`       → Banco: "${r._nome_banco}" | ${r.data} | R$ ${r.valor.toFixed(2)} | ${r.tipo}`)
  })

  if (fuzzyBaixos.length > 0) {
    console.log('\n' + '='.repeat(70))
    console.log(`  ⚠️  FUZZY COM BAIXA CONFIANÇA (${fuzzyBaixos.length}) — revisar antes de executar`)
    console.log('='.repeat(70))
    fuzzyBaixos.forEach((r, i) => {
      console.log(`  ${String(i+1).padStart(3)}. ⚠️  "${r._input_nome}"`)
      console.log(`       → Banco: "${r._nome_banco}" (score: ${r._score}) | ${r.data}`)
    })
  }

  if (naoEncontrados.length > 0) {
    console.log('\n' + '='.repeat(70))
    console.log(`  ❌ NÃO ENCONTRADOS (${naoEncontrados.length}) — NÃO serão inseridos`)
    console.log('='.repeat(70))
    naoEncontrados.forEach((r, i) => {
      console.log(`  ${String(i+1).padStart(3)}. ❌ "${r._input_nome}" | ${r.data}`)
    })
  }

  console.log('\n' + '='.repeat(70))
  console.log('  RESUMO')
  console.log('='.repeat(70))
  const totalValor = [...resolvidos, ...fuzzyBaixos].reduce((a, r) => a + r.valor, 0)
  console.log(`  ✅ Para inserir:         ${resolvidos.length}`)
  console.log(`  ⚠️  Revisão necessária:  ${fuzzyBaixos.length}`)
  console.log(`  ❌ Não encontrados:      ${naoEncontrados.length}`)
  console.log(`  💰 Valor total:          R$ ${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)

  // Bloqueia execute se há não-encontrados
  if (IS_EXECUTE && naoEncontrados.length > 0) {
    console.log('\n🔴 EXECUTE BLOQUEADO: corrija os nomes não encontrados antes de inserir.')
    process.exit(1)
  }

  if (!IS_EXECUTE) {
    console.log('\n📌 Para inserir, execute: node scratch_import_atrasados.js --execute')
    return
  }

  // 5. INSERT (só com --execute e zero não-encontrados)
  const paraInserir = [...resolvidos, ...fuzzyBaixos].map(r => ({
    associado_id: r.associado_id,
    tenant_id: r.tenant_id,
    data: r.data,
    competencia_mes: r.competencia_mes,
    competencia_ano: r.competencia_ano,
    descricao: r.descricao,
    categoria: r.categoria,
    tipo: r.tipo,
    valor: r.valor,
    status: r.status,
    conciliado: r.conciliado,
    banco_transacao_id: r.banco_transacao_id,
  }))

  console.log(`\n🚀 Inserindo ${paraInserir.length} registros em lotes de 50...`)

  const BATCH = 50
  let totalInserido = 0
  const inseridos = []
  const erros = []

  for (let i = 0; i < paraInserir.length; i += BATCH) {
    const lote = paraInserir.slice(i, i + BATCH)
    const loteNum = Math.floor(i / BATCH) + 1
    const { data: inserted, error } = await sb.from('lancamentos').insert(lote).select('id')
    if (error) {
      console.error(`  ❌ Lote ${loteNum}: ${error.message}`)
      erros.push({ lote: loteNum, erro: error.message })
    } else {
      totalInserido += inserted?.length || 0
      inseridos.push(...(inserted || []))
      console.log(`  ✅ Lote ${loteNum}: ${inserted?.length} inserido(s)`)
    }
  }

  // Backup dos inseridos
  const ts = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
  const backupFile = `backup_import_atrasados_${ts}.json`
  fs.writeFileSync(backupFile, JSON.stringify({ timestamp: new Date().toISOString(), total: totalInserido, inseridos, erros }, null, 2))

  console.log('\n' + '='.repeat(70))
  console.log(`  ✅ ${totalInserido} registros inseridos com sucesso`)
  console.log(`  ❌ ${erros.length} lotes com erro`)
  console.log(`  💾 Backup: ${backupFile}`)
  console.log('='.repeat(70))
}

main().catch(err => { console.error('❌ Erro inesperado:', err); process.exit(1) })
