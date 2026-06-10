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
  const nomes = ['Daiane Silva Barbosa', 'Danila Almeida Freire', 'Cinthia Feitoza de Souza']
  
  for (const nome of nomes) {
    const { data: assoc } = await sb.from('associados').select('id, nome').ilike('nome', `%${nome}%`).single()
    if (!assoc) {
      console.log(`${nome} not found`)
      continue
    }
    
    console.log(`\nAssociado: ${assoc.nome}`)
    const { data: lancamentos } = await sb.from('lancamentos')
      .select('id, data, valor, categoria, descricao, competencia_mes, competencia_ano, status')
      .eq('tipo', 'receita')
      .eq('associado_id', assoc.id)
      .order('data', { ascending: true })
      
    lancamentos?.forEach(l => {
      console.log(`- Data: ${l.data} | Comp: ${l.competencia_mes}/${l.competencia_ano} | Cat: ${l.categoria} | Status: ${l.status}`)
    })
  }
}
run()
