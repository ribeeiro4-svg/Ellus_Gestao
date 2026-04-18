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

async function hunt() {
  console.log('--- CAÇA AOS REGISTROS DE 2060 ---')
  
  // Busca exata pelo dia visto no print
  const { data, error } = await supabase
    .from('lancamentos')
    .select('id, data, descricao, tenant_id')
    .eq('data', '2060-04-09')

  if (error) {
    console.error('Erro na busca:', error.message)
    return
  }

  if (data.length === 0) {
    console.log('Nenhum registro encontrado exatamente em 2060-04-09. Tentando busca ampla...')
    const { data: wideData, error: wideError } = await supabase
      .from('lancamentos')
      .select('id, data, descricao, tenant_id')
      .gte('data', '2050-01-01')
      .limit(100)
    
    if (wideError) console.error('Erro na busca ampla:', wideError.message)
    else console.log(`Encontrados ${wideData.length} registros futuros:`, wideData)
  } else {
    console.log(`Encontrados ${data.length} registros. IDs de exemplo:`, data.slice(0, 5).map(l => l.id))
    
    console.log('Deletando todos os registros futuros (>= 2060-01-01)...')
    const { count, error: delError } = await supabase
      .from('lancamentos')
      .delete({ count: 'exact' })
      .gte('data', '2060-01-01')

    if (delError) console.error('Erro ao deletar:', delError.message)
    else console.log(`Sucesso! Foram eliminados ${count} registros do futuro distante.`)
  }
}

hunt()
