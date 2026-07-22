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
  console.log('Fixing competencia_mes from 6 to 5 for June...')
  
  const { data, error } = await supabase
    .from('lancamentos')
    .update({ competencia_mes: 5 })
    .eq('categoria', 'MENSALIDADE')
    .eq('competencia_mes', 6)
    .gte('data', '2026-06-01')
    .lte('data', '2026-06-30') // Only the ones we created in June

  if (error) {
    console.error('Error updating:', error)
  } else {
    console.log('Update successful, updated rows.')
  }
}

run()
