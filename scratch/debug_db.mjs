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

async function debug() {
  console.log('--- RELATÓRIO DE DADOS ---')
  const { data, error } = await supabase
    .from('lancamentos')
    .select('id, data, descricao, tenant_id')
    .order('data', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Erro:', error)
  } else {
    console.log('Top 20 Lançamentos (Ordem Decrescente):')
    data.forEach(l => console.log(`[${l.data}] ${l.descricao.substring(0, 30)}... ID: ${l.id}`))
  }
}

debug()
