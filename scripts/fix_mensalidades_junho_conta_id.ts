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
  console.log('Fetching contas bancarias...')
  const { data: contas, error: errContas } = await supabase
    .from('contas_bancarias')
    .select('*')
    .eq('tipo', 'corrente')
    
  if (errContas) {
    console.error('Error fetching contas:', errContas)
    return
  }
  
  const tenantContas: Record<string, string> = {}
  for (const c of contas) {
    if (!tenantContas[c.tenant_id]) {
      tenantContas[c.tenant_id] = c.id
    }
  }

  console.log('Updating lancamentos created today without conta_id...')
  const { data: lancamentos, error: errLanc } = await supabase
    .from('lancamentos')
    .select('id, tenant_id')
    .eq('categoria', 'MENSALIDADE')
    .is('conta_id', null)
    .gte('data', '2026-06-01')

  if (errLanc) {
    console.error('Error fetching lancamentos:', errLanc)
    return
  }
  
  console.log(`Found ${lancamentos.length} lancamentos to update.`)
  
  let count = 0
  for (const l of lancamentos) {
    const cid = tenantContas[l.tenant_id]
    if (cid) {
      const { error } = await supabase
        .from('lancamentos')
        .update({
          conta_id: cid,
          forma_pagamento: 'Pix'
        })
        .eq('id', l.id)
        
      if (!error) count++
    }
  }
  
  console.log(`Updated ${count} lancamentos with conta_id and forma_pagamento.`)
}

run()
