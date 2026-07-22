import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"](.*)['"]$/, '$1')
  }
})

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'] || ''
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || ''
const sb = createClient(supabaseUrl, supabaseKey)

async function run() {
  const nome = 'Aretha de Oliveira Dias da Silva'
  
  // Find assoc
  const { data: assoc } = await sb.from('associados').select('id, nome').ilike('nome', `%${nome}%`).single()
  
  if (!assoc) {
    console.log('Associado not found')
    return
  }
  
  console.log(`Associado: ${assoc.nome} (${assoc.id})`)
  
  // Find all lancamentos
  const { data: lancamentos } = await sb.from('lancamentos')
    .select('id, data, valor, categoria, descricao, competencia_mes, competencia_ano')
    .eq('tipo', 'receita')
    .or(`associado_id.eq.${assoc.id},descricao.ilike.%${assoc.nome}%`)
    .order('data', { ascending: true })
    
  console.log(`Total lancamentos found: ${lancamentos?.length}`)
  
  lancamentos?.forEach(l => {
    console.log(`- Data: ${l.data} | Valor: ${l.valor} | Categoria: ${l.categoria} | Comp: ${l.competencia_mes}/${l.competencia_ano} | Desc: ${l.descricao.substring(0, 30)}...`)
  })
}

run()
