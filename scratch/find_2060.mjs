import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'url'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = '../.env'

const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=')
  if (key && value) env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '')
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function find() {
  console.log('Buscando lançamentos bizarros...')
  const { data, error } = await supabase
    .from('lancamentos')
    .select('id, data, descricao')
    .ilike('data', '%2060%')
    .limit(10)

  if (error) {
    console.error('Erro:', error)
  } else {
    console.log('Amostra de dados encontrados:', data)
  }
}

find()
