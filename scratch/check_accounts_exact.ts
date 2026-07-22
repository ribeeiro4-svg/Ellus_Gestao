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
  console.log('--- Analisando Todas as Contas ---')
  const { data: accounts } = await sb.from('contas_bancarias').select('*')
  
  if (!accounts || accounts.length === 0) {
    console.log('Nenhuma conta encontrada.')
    return
  }

  for (const acc of accounts) {
    const { count } = await sb.from('lancamentos').select('*', { count: 'exact', head: true }).eq('conta_id', acc.id)
    console.log(`ID: ${acc.id} | Nome: [${acc.nome}] | Lançamentos: ${count}`)
  }
}
run()
