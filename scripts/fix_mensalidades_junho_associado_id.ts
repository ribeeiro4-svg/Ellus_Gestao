import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

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

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('Fetching active members...')
  const { data: associados, error } = await supabase
    .from('associados')
    .select('id, tenant_id, nome, codigo, mensalidade')
    .eq('status', 'ativo')

  if (error) {
    console.error('Error fetching associados:', error)
    return
  }
  console.log(`Found ${associados.length} active members`)

  // Get the lancamentos we just inserted
  const { data: lancamentos, error: errorLancamentos } = await supabase
    .from('lancamentos')
    .select('*')
    .gte('data', '2026-06-01')
    .lte('data', '2026-06-30')
    .eq('categoria', 'Mensalidade')
    .is('associado_id', null)
    
  if (errorLancamentos) {
    console.error('Error fetching lancamentos:', errorLancamentos)
    return
  }

  console.log(`Found ${lancamentos.length} Mensalidade lancamentos in June without associado_id`)

  let updatedCount = 0

  for (const lancamento of lancamentos) {
    // find the matching associado
    const match = associados.find(a => 
      a.tenant_id === lancamento.tenant_id &&
      (lancamento.descricao.includes(a.nome) || lancamento.descricao.includes(a.codigo))
    )

    if (match) {
      const { error: updErr } = await supabase
        .from('lancamentos')
        .update({
          associado_id: match.id,
          competencia_mes: 6,
          competencia_ano: 2026
        })
        .eq('id', lancamento.id)
      
      if (updErr) {
        console.error('Update error:', updErr)
      } else {
        updatedCount++
      }
    } else {
      console.log('No match for:', lancamento.descricao)
    }
  }

  console.log(`Successfully updated ${updatedCount} lancamentos with associado_id and competencia.`)
}

run()
