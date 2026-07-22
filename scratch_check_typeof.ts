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
  const { data } = await sb.from('lancamentos').select('competencia_mes, competencia_ano, data').not('competencia_mes', 'is', null).limit(10)
  console.log(data)
  if (data && data.length > 0) {
    console.log(`typeof competencia_mes:`, typeof data[0].competencia_mes)
    console.log(`typeof competencia_ano:`, typeof data[0].competencia_ano)
  }
}
run()
