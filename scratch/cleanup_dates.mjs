import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '../.env')

const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=')
  if (key && value) env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '')
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: NEXT_PUBLIC_SUPABASE_URL ou PUBLISHABLE_KEY não encontradas.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanup() {
  console.log('Limpando lançamentos de 2060...')
  
  const { error, count } = await supabase
    .from('lancamentos')
    .delete({ count: 'exact' })
    .filter('data', 'gte', '2060-01-01')

  if (error) {
    console.error('Erro:', error.message)
  } else {
    console.log(`Sucesso! ${count} registros de 2060 removidos.`)
  }
}

cleanup()
