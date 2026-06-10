const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const envPath = path.resolve(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^['"](.*)['"]$/, '$1')
  }
})

const sb = createClient(env['NEXT_PUBLIC_SUPABASE_URL'] || '', env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || '')

async function runAudit() {
  console.log('Iniciando auditoria: Lançamentos Maio/2026 a Dez/2026 para Associados Ativos...\n')

  const { data: ativos, error: errAtivos } = await sb.from('associados')
    .select('id, nome, codigo, status')
    
  if (errAtivos || !ativos) {
    console.error('Erro ao buscar associados:', errAtivos)
    return
  }
  
  const ativosFiltrados = ativos.filter(a => a.status?.toLowerCase() === 'ativo')
  console.log(`Total de Associados Ativos: ${ativosFiltrados.length}`)
  
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
  
  const mensalidades = lancamentos.filter(l => 
    (l.categoria?.toUpperCase().includes('MENSALIDADE') || (l.descricao && l.descricao.toUpperCase().includes('MENSALIDADE'))) && 
    l.associado_id != null
  )
  
  console.log(`Total de Mensalidades (Maio-Dez) Associadas: ${mensalidades.length}\n`)
  
  const results = []
  const mesesEsperados = [4, 5, 6, 7, 8, 9, 10, 11]
  const nomesMeses = ['Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  
  let perfectCount = 0
  let missingCount = 0
  
  for (const assoc of ativosFiltrados) {
    const assocLanc = mensalidades.filter(l => l.associado_id === assoc.id)
    const mesesEncontrados = new Set()
    const missingMeses = []
    
    assocLanc.forEach(l => {
      let mes = null
      if (l.competencia_mes != null) {
        mes = Number(l.competencia_mes)
      } else {
        const d = new Date(l.data + 'T12:00:00Z')
        mes = d.getUTCMonth()
      }
      
      if (mesesEsperados.includes(mes)) {
        mesesEncontrados.add(mes)
      }
    })
    
    mesesEsperados.forEach((m, i) => {
      if (!mesesEncontrados.has(m)) {
        missingMeses.push(nomesMeses[i])
      }
    })
    
    if (missingMeses.length === 0) {
      perfectCount++
    } else {
      missingCount++
      results.push({
        nome: assoc.nome,
        codigo: assoc.codigo,
        faltantes: missingMeses
      })
    }
  }
  
  console.log(`=== RESULTADO DA AUDITORIA ATUALIZADO ===`)
  console.log(`- Associados 100% Certos: ${perfectCount}`)
  console.log(`- Associados com Faltantes: ${missingCount}`)
  console.log(`\nLista completa de faltantes:`)
  
  results.forEach(r => {
    console.log(`${r.nome} (#${r.codigo}): ${r.faltantes.join(', ')}`)
  })
}

runAudit()
