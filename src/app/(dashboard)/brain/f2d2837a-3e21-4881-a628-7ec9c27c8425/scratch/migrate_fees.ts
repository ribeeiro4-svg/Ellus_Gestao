
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateFeeSplit() {
  console.log('Iniciando migração de taxas para lançamentos conciliados...')
  
  // 1. Busca todos os lançamentos conciliados que podem precisar de split
  const { data: lancamentos, error } = await supabase
    .from('lancamentos')
    .select('*')
    .eq('tipo', 'receita')
    .eq('conciliado', true)
    .gt('valor', 50)
  
  if (error) {
    console.error('Erro ao buscar lançamentos:', error)
    return
  }

  if (!lancamentos || lancamentos.length === 0) {
    console.log('Nenhum lançamento conciliado pendente de ajuste encontrado.')
    return
  }

  console.log(`Encontrados ${lancamentos.length} lançamentos para análise.`)
  let count = 0

  for (const l of lancamentos) {
    // Verifica categorias alvo
    const isTarget = l.categoria === 'MENSALIDADE' || l.categoria === 'ADESAO' || l.associado_id != null
    
    if (isTarget) {
      const total = Number(l.valor)
      const valorLiquido = 50
      const valorTaxa = total - 50
      const taxaFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTaxa)
      
      const novaDescricao = l.descricao.includes('(Taxa:') 
        ? l.descricao 
        : `${l.descricao} (Taxa: ${taxaFmt})`

      const { error: updError } = await supabase
        .from('lancamentos')
        .update({
          valor: valorLiquido,
          descricao: novaDescricao
        })
        .eq('id', l.id)
      
      if (!updError) {
        console.log(`[OK] Ajustado ID ${l.id}: R$ ${total} -> R$ 50.00 + Taxa R$ ${valorTaxa}`)
        count++
      } else {
        console.error(`[ERRO] Falha ao ajustar ID ${l.id}:`, updError)
      }
    }
  }

  console.log(`Migração concluída! ${count} lançamentos foram corrigidos.`)
}

migrateFeeSplit()
