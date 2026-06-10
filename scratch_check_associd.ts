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

const sb = createClient(env['NEXT_PUBLIC_SUPABASE_URL'] || '', env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || '')

async function run() {
  const nome = 'Aretha de Oliveira Dias da Silva'
  const { data: assoc } = await sb.from('associados').select('id, nome').ilike('nome', `%${nome}%`).single()
  
  const { data: lancamentos } = await sb.from('lancamentos')
    .select('id, associado_id, data, valor, categoria, descricao, competencia_mes')
    .eq('tipo', 'receita')
    .or(`associado_id.eq.${assoc?.id},descricao.ilike.%${nome}%`)
    .order('data', { ascending: true })
    
  lancamentos?.forEach(l => {
    console.log(`- Data: ${l.data} | Comp: ${l.competencia_mes} | AssocId: ${l.associado_id === assoc?.id ? 'OK' : l.associado_id}`)
  })
}
run()
