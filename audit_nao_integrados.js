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

async function find() {
  const tenantId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'

  // Lançamentos integrados vs não integrados por categoria
  const { data: integrados } = await sb
    .from('lancamentos_contabeis')
    .select('origem_id')
    .eq('tenant_id', tenantId)
    .eq('origem_tipo', 'financeiro')

  const integradosIds = new Set((integrados || []).map(i => i.origem_id))

  // Pegar todos os pago/conciliado
  const { data: items } = await sb
    .from('lancamentos')
    .select('id, categoria, status')
    .eq('tenant_id', tenantId)
    .or('status.eq.pago,status.eq.conciliado,status.eq.Pago,status.eq.Conciliado')

  // Agrupar não integrados por categoria
  const naoIntegrados = {}
  for (const i of (items || [])) {
    if (!integradosIds.has(i.id)) {
      const cat = i.categoria || '(sem categoria)'
      naoIntegrados[cat] = (naoIntegrados[cat] || 0) + 1
    }
  }

  // Ordenar por quantidade
  const sorted = Object.entries(naoIntegrados).sort((a, b) => b[1] - a[1])
  console.log('\n=== CATEGORIAS SEM INTEGRAÇÃO CONTÁBIL ===')
  for (const [cat, count] of sorted) {
    console.log(`  [${count.toString().padStart(3)}] ${cat}`)
  }
  console.log(`\nTotal não integrados: ${Object.values(naoIntegrados).reduce((a, b) => a + b, 0)}`)
  console.log(`Total integrados: ${integradosIds.size}`)
}
find()
