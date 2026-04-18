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

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('--- OPERAÇÃO LIMPEZA 2060 ---')
  
  // Como o delete via filtro pode falhar se o tipo for string, vamos tentar várias abordagens
  
  // 1. Tentar gte no ano 2060
  console.log('Abordagem 1: Deletando por data gte 2060-01-01...')
  const { count: c1, error: e1 } = await supabase
    .from('lancamentos')
    .delete({ count: 'exact' })
    .gte('data', '2060-01-01')
  
  if (e1) console.error('Erro 1:', e1.message)
  else console.log(`Removidos via gte: ${c1}`)

  // 2. Tentar busca por padrão string %2060%
  console.log('Abordagem 2: Deletando por padrão de string %2060%...')
  const { count: c2, error: e2 } = await supabase
    .from('lancamentos')
    .delete({ count: 'exact' })
    .ilike('data', '%2060%')

  if (e2) console.error('Erro 2:', e2.message)
  else console.log(`Removidos via pattern: ${c2}`)

  console.log('--- OPERAÇÃO CONCLUÍDA ---')
}

run()
