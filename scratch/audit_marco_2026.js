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

async function audit() {
  const { data: lancamentos } = await sb
    .from('lancamentos')
    .select('*')
    .gte('data', '2026-03-01')
    .lte('data', '2026-03-31')
  
  const { data: associados } = await sb
    .from('associados')
    .select('id, nome')

  console.log('--- MARÇO 2026 AUDIT ---')
  console.log('Total Lancamentos:', lancamentos.length)

  const namesToFind = [
    'Alan Rodrigues',
    'Jaime Belarmino Gomes',
    'Gilvan Araújo Ribeiro',
    'Élida Cristina Barroso Cruz',
    'Cinthia Rejane Da Silva Pereira Rocha',
    'Flávia Alves S. Nunes Nogueira',
    'Maria Greicia Vieira Dos Santos'
  ]

  console.log('\n--- TARGET SEARCH ---')
  namesToFind.forEach(name => {
    const assoc = associados.find(a => a.nome.toLowerCase().includes(name.toLowerCase()))
    const related = lancamentos.filter(l => {
        const descMatch = l.descricao.toLowerCase().includes(name.toLowerCase())
        const assocMatch = assoc && l.associado_id === assoc.id
        return descMatch || assocMatch
    })
    
    console.log(`\n[${name}] (Assoc ID: ${assoc?.id || 'NOT FOUND'})`)
    if (related.length === 0) {
        console.log('  -> No transactions found.')
    } else {
        related.forEach(l => {
            console.log(`  - ID: ${l.id} | Data: ${l.data} | Valor: ${l.valor} | Desc: ${l.descricao}`)
        })
    }
  })

  console.log('\n--- POTENTIAL MISSING (TRANSF PIX RECEBIDA) ---')
  const unnamed = lancamentos.filter(l => l.descricao.includes('TRANSF PIX RECEBIDA') && !l.associado_id)
  unnamed.forEach(l => {
    console.log(`  - ID: ${l.id} | Data: ${l.data} | Valor: ${l.valor} | Desc: ${l.descricao}`)
  })
}

audit()
