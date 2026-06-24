import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('Buscando lancamentos com status_cobranca = EM COBRANÇA...')
  
  const { data: lancamentos, error } = await supabase
    .from('lancamentos')
    .select('id, associado_id, tenant_id, data')
    .eq('status_cobranca', 'EM COBRANÇA')
    
  if (error) {
    console.error('Erro ao buscar lancamentos:', error)
    return
  }
  
  if (!lancamentos || lancamentos.length === 0) {
    console.log('Nenhum lancamento encontrado.')
    return
  }
  
  console.log(`Encontrados ${lancamentos.length} lancamentos. Verificando ações existentes...`)
  
  const associadoIds = lancamentos.map(l => l.associado_id)
  
  const { data: acoes, error: errAcoes } = await supabase
    .from('cobranca_acoes')
    .select('associado_id')
    .in('associado_id', associadoIds)
    .eq('etapa', 'EmCobrança')
    
  if (errAcoes) {
    console.error('Erro ao buscar acoes:', errAcoes)
    return
  }
  
  const existingAcoesIds = new Set(acoes.map(a => a.associado_id))
  
  const associadosParaInserir = Array.from(new Set(
    lancamentos
      .map(l => l.associado_id)
      .filter(id => !existingAcoesIds.has(id))
  ))
  
  if (associadosParaInserir.length === 0) {
    console.log('Todos os associados já possuem histórico.')
    return
  }
  
  console.log(`Inserindo ${associadosParaInserir.length} novos registros no histórico...`)
  
  const payload = associadosParaInserir.map(id => {
    const l = lancamentos.find(x => x.associado_id === id)!
    return {
      tenant_id: l.tenant_id,
      associado_id: id,
      etapa: 'EmCobrança',
      canal: 'Sistema',
      observacao: 'Registro criado retroativamente (tag pré-existente)',
      texto_enviado: 'Tag',
      realizado_por: '00000000-0000-0000-0000-000000000000'
    }
  })
  
  const { error: insertErr } = await supabase
    .from('cobranca_acoes')
    .insert(payload)
    
  if (insertErr) {
    console.error('Erro ao inserir acoes:', insertErr)
  } else {
    console.log('Concluído com sucesso!')
  }
}

run()
