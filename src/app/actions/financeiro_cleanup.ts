'use server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Remove mensalidades duplicadas para o mesmo associado no mesmo mês/ano,
 * desde que o lançamento NÃO esteja conciliado.
 */
export async function cleanupDuplicateMensalidadesAction() {
  const sb = await createServerSupabase()

  // 1. Buscar todos os lançamentos que podem ser mensalidades
  const { data: lancamentos, error } = await sb
    .from('financeiro')
    .select('id, associado_id, data, competencia_mes, competencia_ano, conciliado, descricao, categoria')
    .eq('tipo', 'receita')
    .or('categoria.eq.Mensalidade,descricao.ilike.%MENSALIDADE%')

  if (error) return { error: error.message }
  if (!lancamentos || lancamentos.length === 0) return { count: 0 }

  // 2. Agrupar por associado e período
  const groups: Record<string, any[]> = {}

  lancamentos.forEach(l => {
    if (!l.associado_id) return

    // Tenta pegar mes/ano da competencia ou da data
    let mes = l.competencia_mes
    let ano = l.competencia_ano

    if (mes === null || ano === null) {
      const d = new Date(l.data)
      mes = d.getUTCMonth()
      ano = d.getUTCFullYear()
    }

    const key = `${l.associado_id}_${mes}_${ano}`
    if (!groups[key]) groups[key] = []
    groups[key].push(l)
  })

  const idsToDelete: string[] = []
  const associatesAffected = new Set<string>()

  // 3. Identificar duplicatas em cada grupo
  Object.values(groups).forEach(group => {
    if (group.length <= 1) return

    // Ordenar: Conciliados primeiro (para não deletar), depois os mais antigos
    const conciliados = group.filter(l => l.conciliado === true)
    const pendentes = group.filter(l => l.conciliado !== true)

    let deletedInThisGroup = 0
    if (conciliados.length > 0) {
      pendentes.forEach(p => {
        idsToDelete.push(p.id)
        deletedInThisGroup++
      })
    } else if (pendentes.length > 1) {
      for (let i = 1; i < pendentes.length; i++) {
        idsToDelete.push(pendentes[i].id)
        deletedInThisGroup++
      }
    }

    if (deletedInThisGroup > 0) {
      // Tenta extrair o nome do associado da descrição ou via busca posterior
      // Mas como temos o associado_id, seria melhor buscar os nomes
      associatesAffected.add(group[0].associado_id)
    }
  })

  if (idsToDelete.length === 0) {
    return { count: 0, message: 'Nenhuma duplicata pendente encontrada.' }
  }

  // 3.5 Buscar nomes dos associados afetados para o relatório
  const { data: namesData } = await sb
    .from('associados')
    .select('nome')
    .in('id', Array.from(associatesAffected))

  const namesList = (namesData || []).map(a => a.nome).sort()

  // 4. Executar a exclusão
  const { error: deleteError } = await sb
    .from('financeiro')
    .delete()
    .in('id', idsToDelete)

  if (deleteError) return { error: deleteError.message }

  return { 
    success: true, 
    count: idsToDelete.length, 
    names: namesList,
    message: `${idsToDelete.length} mensalidades duplicadas removidas de ${namesList.length} associados.` 
  }
}
