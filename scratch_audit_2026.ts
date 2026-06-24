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

async function runAudit() {
  console.log('Iniciando auditoria: Lançamentos Maio/2026 a Dez/2026 para Associados Ativos...\n')

  // 1. Fetch active associates
  const { data: ativos, error: errAtivos } = await sb.from('associados')
    .select('id, nome, codigo, status')
    
  if (errAtivos || !ativos) {
    console.error('Erro ao buscar associados:', errAtivos)
    return
  }
  
  const ativosFiltrados = ativos.filter(a => a.status?.toLowerCase() === 'ativo')
  
  console.log(`Total de Associados Ativos: ${ativosFiltrados.length}`)
  
  // 2. Fetch all mensalidades in the period
  const start = '2026-05-01'
  const end = '2026-12-31'
  
  const { data: lancamentos, error: errLanc } = await sb.from('lancamentos')
    .select('id, associado_id, data, valor, categoria, competencia_mes')
    .eq('tipo', 'receita')
    .gte('data', start)
    .lte('data', end)
    
  if (errLanc || !lancamentos) {
    console.error('Erro ao buscar lançamentos:', errLanc)
    return
  }
  
  // Filter for mensalidades
  const mensalidades = lancamentos.filter(l => 
    l.categoria?.toUpperCase().includes('MENSALIDADE') && 
    l.associado_id != null
  )
  
  console.log(`Total de Mensalidades (Maio-Dez) Associadas: ${mensalidades.length}\n`)
  
  const results: any[] = []
  
  // 3. Cross-reference
  const mesesEsperados = [4, 5, 6, 7, 8, 9, 10, 11] // Maio(4) a Dez(11) 0-indexed
  const nomesMeses = ['Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  
  let perfectCount = 0
  let missingCount = 0
  let duplicateCount = 0
  let multipleMissingCount = 0
  
  for (const assoc of ativosFiltrados) {
    const assocLanc = mensalidades.filter(l => l.associado_id === assoc.id)
    
    // Map existing months
    const mesesEncontrados = new Set<number>()
    const duplicatas = new Set<number>()
    const missingMeses: string[] = []
    
    assocLanc.forEach(l => {
      let mes = null
      if (l.competencia_mes != null) {
        mes = Number(l.competencia_mes)
      } else {
        const d = new Date(l.data + 'T12:00:00Z')
        mes = d.getUTCMonth()
      }
      
      if (mesesEsperados.includes(mes)) {
        if (mesesEncontrados.has(mes)) {
          duplicatas.add(mes)
        } else {
          mesesEncontrados.add(mes)
        }
      }
    })
    
    // Check missing
    mesesEsperados.forEach((m, i) => {
      if (!mesesEncontrados.has(m)) {
        missingMeses.push(nomesMeses[i])
      }
    })
    
    if (missingMeses.length === 0 && duplicatas.size === 0) {
      perfectCount++
    } else {
      if (missingMeses.length > 0) missingCount++
      if (missingMeses.length > 1) multipleMissingCount++
      if (duplicatas.size > 0) duplicateCount++
      
      results.push({
        nome: assoc.nome,
        codigo: assoc.codigo,
        faltantes: missingMeses,
        duplicatas: Array.from(duplicatas).map(m => nomesMeses[mesesEsperados.indexOf(m)])
      })
    }
  }
  
  console.log(`=== RESULTADO DA AUDITORIA ===`)
  console.log(`- Associados Ativos Totais: ${ativosFiltrados.length}`)
  console.log(`- Associados 100% Certos (Maio-Dez sem duplicatas): ${perfectCount}`)
  console.log(`- Associados com ALGUMA Mensalidade Faltante: ${missingCount}`)
  console.log(`  └─ Desses, com VÁRIAS Faltantes (>1): ${multipleMissingCount}`)
  console.log(`- Associados com Mensalidades Duplicadas: ${duplicateCount}`)
  console.log(`\nDetalhes dos Divergentes (Amostra de até 15 com problema de duplicata ou faltantes aleatórios):`)
  
  // Vamos priorizar mostrar quem tem duplicata ou poucas faltantes (talvez as de julho?)
  const amostra = results.filter(r => r.duplicatas.length > 0 || (r.faltantes.length > 0 && r.faltantes.length < 8)).slice(0, 15)
  
  amostra.forEach(r => {
    console.log(`\n> ${r.nome} (#${r.codigo})`)
    if (r.faltantes.length > 0) console.log(`  Faltam: ${r.faltantes.join(', ')}`)
    if (r.duplicatas.length > 0) console.log(`  Duplicadas (2x ou mais): ${r.duplicatas.join(', ')}`)
  })
}

runAudit()
