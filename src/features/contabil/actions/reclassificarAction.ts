'use server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function reclassificarLancamentoAction(
  lancamentoId: string,
  contaAntigaId: string,
  novaContaId: string
) {
  const sb = await createServerSupabase()
  
  try {
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return { error: 'Sessão expirada' }

    const { data: contaAntiga } = await sb.from('plano_contas').select('codigo').eq('id', contaAntigaId).single()
    const { data: novaConta } = await sb.from('plano_contas').select('codigo').eq('id', novaContaId).single()

    if (!contaAntiga || !novaConta) throw new Error('Contas não encontradas no plano')

    // LÓGICA DE INVERSÃO AUTOMÁTICA (Consertar lançamentos invertidos no passado)
    const isAntigaDespesa = contaAntiga.codigo.startsWith('3')
    const isNovaReceita = novaConta.codigo.startsWith('4')
    const isAntigaReceita = contaAntiga.codigo.startsWith('4')
    const isNovaDespesa = novaConta.codigo.startsWith('3')

    const deveInverter = (isAntigaDespesa && isNovaReceita) || (isAntigaReceita && isNovaDespesa)

    if (deveInverter) {
      const { data: partidas } = await sb.from('lancamentos_partidas').select('id, tipo_partida').eq('lancamento_id', lancamentoId)
      if (partidas) {
        for (const p of partidas) {
          const novoTipo = p.tipo_partida === 'D' ? 'C' : 'D'
          await sb.from('lancamentos_partidas').update({ tipo_partida: novoTipo }).eq('id', p.id)
        }
      }
    }

    // 1. Atualizar a partida contábil principal
    const { error: updateErr } = await sb
      .from('lancamentos_partidas')
      .update({ conta_id: novaContaId })
      .eq('lancamento_id', lancamentoId)
      .eq('conta_id', contaAntigaId)

    if (updateErr) throw updateErr

    // 2. Registrar Log de Auditoria
    const { data: lancamento } = await sb
      .from('lancamentos_contabeis')
      .select('tenant_id, numero_lancamento, historico')
      .eq('id', lancamentoId)
      .single()

    if (lancamento) {
      await sb.from('contabil_logs').insert({
        tenant_id: lancamento.tenant_id,
        acao: 'RECLASSIFICAÇÃO',
        detalhes: `Lançamento ${lancamento.numero_lancamento} reclassificado de [${contaAntiga.codigo}] para [${novaConta.codigo}]. ${deveInverter ? 'Natureza Invertida Automaticamente.' : ''} Histórico: ${lancamento.historico}`
      })
    }

    return { success: true }
  } catch (err: any) {
    console.error('[Contábil] Erro na reclassificação:', err)
    return { error: err.message }
  }
}

export async function reclassificarLoteAction(
  itens: { lancamentoId: string; contaAntigaId: string }[],
  novaContaId: string
) {
  const sb = await createServerSupabase()
  
  try {
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return { error: 'Sessão expirada' }

    const { data: novaConta } = await sb.from('plano_contas').select('codigo').eq('id', novaContaId).single()
    if (!novaConta) throw new Error('Nova conta não encontrada')

    const isNovaReceita = novaConta.codigo.startsWith('4')
    const isNovaDespesa = novaConta.codigo.startsWith('3')

    const logs = []

    for (const item of itens) {
      const { data: contaAntiga } = await sb.from('plano_contas').select('codigo').eq('id', item.contaAntigaId).single()
      if (!contaAntiga) continue

      const isAntigaDespesa = contaAntiga.codigo.startsWith('3')
      const isAntigaReceita = contaAntiga.codigo.startsWith('4')
      
      const deveInverter = (isAntigaDespesa && isNovaReceita) || (isAntigaReceita && isNovaDespesa)

      if (deveInverter) {
        const { data: partidas } = await sb.from('lancamentos_partidas').select('id, tipo_partida').eq('lancamento_id', item.lancamentoId)
        if (partidas) {
          for (const p of partidas) {
            const novoTipo = p.tipo_partida === 'D' ? 'C' : 'D'
            await sb.from('lancamentos_partidas').update({ tipo_partida: novoTipo }).eq('id', p.id)
          }
        }
      }

      const { error: updateErr } = await sb
        .from('lancamentos_partidas')
        .update({ conta_id: novaContaId })
        .eq('lancamento_id', item.lancamentoId)
        .eq('conta_id', item.contaAntigaId)

      if (updateErr) throw updateErr

      const { data: lancamento } = await sb
        .from('lancamentos_contabeis')
        .select('tenant_id, numero_lancamento, historico')
        .eq('id', item.lancamentoId)
        .single()

      if (lancamento) {
        logs.push({
          tenant_id: lancamento.tenant_id,
          acao: 'RECLASSIFICAÇÃO LOTE',
          detalhes: `Lançamento ${lancamento.numero_lancamento} reclassificado de [${contaAntiga.codigo}] para [${novaConta.codigo}]. ${deveInverter ? 'Natureza Invertida Automaticamente.' : ''} Histórico: ${lancamento.historico}`
        })
      }
    }

    if (logs.length > 0) {
      await sb.from('contabil_logs').insert(logs)
    }

    return { success: true }
  } catch (err: any) {
    console.error('[Contábil] Erro na reclassificação em lote:', err)
    return { error: err.message }
  }
}
