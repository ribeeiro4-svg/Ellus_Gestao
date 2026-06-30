import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// load env vars from .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local')
const envData = fs.readFileSync(envPath, 'utf8')
const envs: Record<string, string> = {}
envData.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    envs[match[1]] = match[2] ? match[2].trim() : ''
  }
})

const supabaseUrl = envs.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envs.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('Fetching active members who joined before 2026-06-01...')
  const { data: associados, error } = await supabase
    .from('associados')
    .select('*')
    .eq('status', 'ativo')
    .lt('data_ingresso', '2026-06-01')

  if (error) {
    console.error('Error fetching associados:', error)
    return
  }

  console.log(`Found ${associados.length} active members joined before 2026-06-01`)

  // Get all 'Mensalidade' lancamentos in June 2026 to avoid duplicates
  const { data: lancamentosJunho, error: errorLancamentos } = await supabase
    .from('lancamentos')
    .select('*')
    .gte('data', '2026-06-01')
    .lte('data', '2026-06-30')
    .eq('categoria', 'Mensalidade')
    
  if (errorLancamentos) {
    console.error('Error fetching lancamentos:', errorLancamentos)
    return
  }

  console.log(`Found ${lancamentosJunho.length} Mensalidade lancamentos in June 2026`)

  const associadosComLancamento = new Set(
    lancamentosJunho.map(l => {
      // We might need to parse the associado from descricao or maybe there is a relation?
      // Wait, lancamentos only has: id, tenant_id, data, descricao, categoria, tipo, valor, status.
      // Descricao is usually something like "Mensalidade - João Silva" or just "Mensalidade - 06/2026".
      // Let's print some descriptions to understand.
      return l.descricao
    })
  )

  const toInsert = []

  for (const assoc of associados) {
    // Check if this member already has a mensalidade in June
    // Normally descricao has the member name or code.
    const alreadyHas = lancamentosJunho.some(l => 
      l.tenant_id === assoc.tenant_id && 
      (l.descricao.includes(assoc.nome) || l.descricao.includes(assoc.codigo))
    )

    if (!alreadyHas && assoc.mensalidade > 0) {
      toInsert.push({
        tenant_id: assoc.tenant_id,
        data: '2026-06-10', // Assuming a default due date
        descricao: `Mensalidade - ${assoc.nome}`,
        categoria: 'Mensalidade',
        tipo: 'receita',
        valor: assoc.mensalidade,
        status: 'aberto'
      })
    }
  }

  console.log(`Need to insert ${toInsert.length} mensalidades for June.`)

  if (toInsert.length > 0) {
    // Insert in chunks
    const chunkSize = 100
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize)
      const { error: insertError } = await supabase.from('lancamentos').insert(chunk)
      if (insertError) {
        console.error('Error inserting:', insertError)
      } else {
        console.log(`Inserted chunk ${i / chunkSize + 1}`)
      }
    }
    console.log('Finished inserting.')
  }
}

run()
