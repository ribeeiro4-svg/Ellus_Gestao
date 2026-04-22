'use server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Remove mensalidades duplicadas para o mesmo associado no mesmo mês/ano,
 * desde que o lançamento NÃO esteja conciliado.
 */
export async function cleanupDuplicateMensalidadesAction() {
  const sb = await createServerSupabase()

  // 1. Buscar lançamentos que possuam associado_id (potenciais mensalidades/adesões)
  const { data: lancamentos, error } = await sb
    .from('lancamentos')
    .select('id, associado_id, data, competencia_mes, competencia_ano, conciliado, status, descricao, categoria, valor, associados ( nome )')
    .eq('tipo', 'receita')
    .not('associado_id', 'is', null)

  if (error) return { error: error.message }
  if (!lancamentos || lancamentos.length === 0) return { count: 0 }

  // 1.5 Filtrar apenas o que parece ser mensalidade ou adesão para evitar deletar outras receitas do associado
  const filteredLancamentos = lancamentos.filter(l => {
    const desc = (l.descricao || '').toUpperCase()
    const cat = (l.categoria || '').toUpperCase()
    return desc.includes('MENSALIDADE') || cat.includes('MENSALIDADE') || 
           desc.includes('ADESÃO') || cat.includes('ADESÃO')
  })

  if (filteredLancamentos.length === 0) return { count: 0, message: 'Nenhum lançamento de mensalidade encontrado.' }

  // 2. Agrupar por NOME do associado e MÊS/ANO do vencimento
  // Usar o nome e o mês garante que pegaremos duplicatas mesmo se o formato da data no banco divergir (ex: 2026-12-10 vs 10/12/2026)
  const groups: Record<string, any[]> = {}

  filteredLancamentos.forEach(l => {
    if (!l.associado_id || !l.data) return

    // Normalizar a data para pegar o Ano e Mês de forma robusta
    let yearMonth = ''
    const str = l.data.split('T')[0]
    if (str.includes('-')) {
      const parts = str.split('-')
      yearMonth = parts[0].length === 4 ? `${parts[0]}-${parts[1]}` : `${parts[2]}-${parts[1]}`
    } else if (str.includes('/')) {
      const parts = str.split('/')
      yearMonth = parts.length >= 3 ? (parts[2].length === 4 ? `${parts[2]}-${parts[1]}` : `${parts[0]}-${parts[1]}`) : str
    } else {
      yearMonth = str
    }
    
    // Tenta pegar o nome do objeto join, se não, tenta extrair da descrição
    let nome = ''
    if (l.associados && (l.associados as any).nome) {
      nome = (l.associados as any).nome
    } else {
      const partes = l.descricao.split('-')
      nome = partes.length > 1 ? partes[1].trim() : l.associado_id
    }
    
    // Normalizar nome para evitar diferenças
    const nomeNorm = nome.toUpperCase().trim()

    const key = `${nomeNorm}_${yearMonth}`
    if (!groups[key]) groups[key] = []
    groups[key].push(l)
  })

  const idsToDelete: string[] = []
  const associatesAffected = new Set<string>()

  // 3. Identificar duplicatas em cada grupo
  Object.values(groups).forEach(group => {
    if (group.length <= 1) return

    // Queremos apenas limpar os que estão 'aberto' (pendentes puramente).
    // Se houver um 'pago', 'atrasado' ou 'conciliado', consideramos como registro oficial a não ser apagado.
    const protegidos = group.filter(l => {
      const s = (l.status || '').toLowerCase().trim()
      return l.conciliado === true || s === 'pago' || s === 'atrasado'
    })
    const pendentes = group.filter(l => {
      const s = (l.status || '').toLowerCase().trim()
      return l.conciliado !== true && s !== 'pago' && s !== 'atrasado'
    })

    let deletedInThisGroup = 0
    
    if (protegidos.length > 0) {
      // Se já tem um protegido, deleta TODOS os pendentes (duplicatas em aberto)
      pendentes.forEach(p => {
        idsToDelete.push(p.id)
        deletedInThisGroup++
      })
    } else if (pendentes.length > 1) {
      // Ordena por data de criação (mais recente primeiro) ou apenas pega do índice 1
      for (let i = 1; i < pendentes.length; i++) {
        idsToDelete.push(pendentes[i].id)
        deletedInThisGroup++
      }
    }

    if (deletedInThisGroup > 0) {
      associatesAffected.add(group[0].associado_id)
    }
  })

  if (idsToDelete.length === 0) {
    const maxGroup = Math.max(0, ...Object.values(groups).map(g => g.length));
    return { count: 0, message: `Nenhuma duplicata excluída.\nDiagnóstico: Lidos ${filteredLancamentos.length} registros, formados ${Object.keys(groups).length} grupos. Maior grupo tem ${maxGroup} itens.` }
  }

  // 3.5 Buscar nomes dos associados afetados para o relatório
  const { data: namesData } = await sb
    .from('associados')
    .select('nome')
    .in('id', Array.from(associatesAffected))

  const namesList = (namesData || []).map(a => a.nome).sort()

  // 4. Executar a exclusão
  const { error: deleteError } = await sb
    .from('lancamentos')
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
