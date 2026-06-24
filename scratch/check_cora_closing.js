const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
function getEnv(key) {
  try {
    const content = fs.readFileSync('.env', 'utf8')
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.trim().startsWith(key + '=')) {
        return line.split('=')[1].trim().replace(/^"|"$/g, '')
      }
    }
  } catch (e) {}
  return null
}
const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const key = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const sb = createClient(url, key)

async function run() {
  const { data: lancamentos } = await sb.from('lancamentos')
    .select('id, tipo, valor, status, data, data_conciliacao, conta_id, descricao')
    .eq('conta_id', '066ec451-264c-44f5-ab8e-b140aa62b368') // CORA PJ
    .eq('status', 'pago')

  console.log('CORA PJ Paid Lancamentos before 2026-01-01:')
  const before2026 = lancamentos.filter(l => {
    const d = l.data_conciliacao || l.data
    return d < '2026-01-01'
  })
  console.table(before2026.map(l => ({
    data: l.data_conciliacao || l.data,
    tipo: l.tipo,
    valor: l.valor,
    descricao: l.descricao
  })))

  const sumBefore = before2026.reduce((acc, l) => {
    const v = Math.abs(l.valor)
    return l.tipo === 'receita' ? acc + v : acc - v
  }, 0)
  console.log('Sum before 2026:', sumBefore)
}
run()
