
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const sb = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('--- Iniciando fix de Plano de Contas: ADESÃO ---')
  
  const { data: tenants } = await sb.from('tenants').select('id, name')
  if (!tenants) {
    console.error('Nenhum tenant encontrado.')
    return
  }
  
  for (const t of tenants) {
    console.log(`Processando tenant: ${t.name} (${t.id})`)
    
    const accountsToAdd = [
      { codigo: '1.1.2.4', descricao: 'Taxas de Adesão', nivel: 4, tipo: 'analitica', natureza: 'devedora', classificacao: 'ativo', aceita_lancamentos: true, ativa: true, parent: '1.1.2' },
      { codigo: '3.1.3', descricao: 'Taxas de Adesão', nivel: 3, tipo: 'analitica', natureza: 'credora', classificacao: 'ingresso', aceita_lancamentos: true, ativa: true, parent: '3.1' }
    ]
    
    for (const acc of accountsToAdd) {
      const { data: existing } = await sb.from('plano_contas')
        .select('id')
        .eq('tenant_id', t.id)
        .eq('codigo', acc.codigo)
        .maybeSingle()
        
      if (!existing) {
        console.log(`  Adicionando conta ${acc.codigo}: ${acc.descricao}`)
        
        // Busca o pai
        const { data: pai } = await sb.from('plano_contas')
          .select('id')
          .eq('tenant_id', t.id)
          .eq('codigo', acc.parent)
          .maybeSingle()
          
        const { error } = await sb.from('plano_contas').insert({
          tenant_id: t.id,
          codigo: acc.codigo,
          descricao: acc.descricao,
          nivel: acc.nivel,
          tipo: acc.tipo,
          natureza: acc.natureza,
          classificacao: acc.classificacao,
          aceita_lancamentos: acc.aceita_lancamentos,
          ativa: acc.ativa,
          conta_pai_id: pai?.id || null
        })
        
        if (error) console.error(`  Erro ao inserir ${acc.codigo}:`, error.message)
      } else {
        console.log(`  Conta ${acc.codigo} já existe.`)
      }
    }
  }
  console.log('--- Concluído ---')
}

run()
