import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Parse .env manually
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
  const { data: associados } = await sb.from('associados').select('id, nome, status').eq('status', 'ativo')
  
  let lancamentos: any[] = []
  let from = 0
  const step = 1000
  let hasMore = true

  while (hasMore) {
    const { data, error } = await sb.from('lancamentos')
      .select('id, associado_id, data, categoria, descricao, competencia_mes, competencia_ano, valor')
      .eq('tipo', 'receita')
      .range(from, from + step - 1)

    if (error) throw error
    if (!data || data.length === 0) {
      hasMore = false
    } else {
      lancamentos = [...lancamentos, ...data]
      if (data.length < step) hasMore = false
      else from += step
    }
  }
  
  console.log(`Total active associates: ${associados?.length}`)
  console.log(`Total lancamentos (receitas): ${lancamentos.length}`)
  
  const targetMonth = 6 // July (0-indexed)
  const targetYear = 2026
  
  const missing: any[] = []
  let found = 0

  for (const a of associados || []) {
    const hasRecurrence = lancamentos.some(l => {
      const matchAssoc = l.associado_id === a.id || (l.descricao && l.descricao.toUpperCase().includes(a.nome.toUpperCase()))
      const matchCat = l.categoria === 'Mensalidade' || (l.descricao && l.descricao.toUpperCase().includes('MENSALIDADE'))
      
      const mesData = parseInt(l.data.split('-')[1]) - 1
      const anoData = parseInt(l.data.split('-')[0])
      
      const matchPeriod = (l.competencia_mes === targetMonth && l.competencia_ano === targetYear) ||
                          (mesData === targetMonth && anoData === targetYear)
                          
      return matchAssoc && matchCat && matchPeriod
    })
    
    if (hasRecurrence) {
      found++
    } else {
      missing.push(a)
    }
  }
  
  console.log(`\nFound recurrences for July 2026: ${found}`)
  console.log(`Missing recurrences for July 2026: ${missing.length}`)
}

run()
