import { useLancamentosContabeis } from '@/features/contabil/hooks/useLancamentosContabeis'
import { useProdutosEstoque } from '@/features/fiscal/hooks/useProdutosEstoque'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from '@/lib/hooks/useTenantId'

export function useIntegracaoFiscalContabil() {
  const tenantId = useTenantId()
  const lancContabil = useLancamentosContabeis()
  const estoque = useProdutosEstoque()
  const sb = createClient()

  /**
   * Finaliza a escrituração de uma NF-e, gerando os lançamentos contábeis 
   * e as entradas no estoque conforme a classificação realizada.
   */
  /**
   * Finaliza a escrituração de uma NF-e vinculando ao financeiro e estoque.
   */
  const finalizarEscrituracao = async (nfeId: string, financeiroId: string, dataEfetiva?: string) => {
    if (!tenantId) return { error: 'Tenant não identificado' }

    try {
      // 1. Buscar a NF-e e seus itens classificados
      const { data: nfe, error: nfeError } = await sb.from('nfe_entradas')
        .select('*, itens:nfe_entradas_itens(*)')
        .eq('id', nfeId)
        .single()

      if (nfeError || !nfe) return { error: 'NF-e não encontrada' }
      
      // 2. Criar Vínculo
      await sb.from('nfse_financeiro_vinculo').insert({
        tenant_id: tenantId,
        nfe_id: nfe.id,
        financeiro_id: financeiroId,
        tipo_vinculo: 'escrituracao_nfe'
      })

      // 3. Processar Estoque (Funcionalidade Mantida)
      for (const item of nfe.itens) {
        let produtoId = item.produto_vinc_id
        
        // Cadastro automático se não vinculado
        if (!produtoId) {
          const { data: existente } = await sb.from('produtos').select('id').eq('tenant_id', tenantId).eq('descricao', item.descricao_produto).limit(1).maybeSingle()
          if (existente) {
            produtoId = existente.id
          } else {
            const { error: createErr } = await estoque.criarProduto({
              descricao: item.descricao_produto,
              ncm: item.ncm || '',
              unidade_medida: item.unidade_comercial || 'UN',
              tipo_produto: item.destinacao_item?.startsWith('4') ? 'imobilizado' : 'mercadoria',
              codigo_fornecedor: item.codigo_produto || '',
              codigo_ean: item.codigo_ean || '',
              destinacao_padrao: item.destinacao_item,
              controla_estoque: ['2', '3', '3.1', '10'].includes(item.destinacao_item),
              estoque_minimo: 0,
              estoque_maximo: null,
              ponto_pedido: null,
              custo_medio_ponderado: Number(item.valor_unitario),
              ultimo_custo_compra: Number(item.valor_unitario),
              data_ultima_compra: new Date().toISOString().split('T')[0],
              ativo: true
            })
            if (!createErr) {
              const { data: novo } = await sb.from('produtos').select('id').eq('tenant_id', tenantId).eq('descricao', item.descricao_produto).maybeSingle()
              produtoId = novo?.id
            }
          }
        }

        const deveLancarEstoque = ['2', '3', '3.1', '10'].includes(item.destinacao_item)
        if (produtoId && deveLancarEstoque) {
          await estoque.registrarEntrada(produtoId, Number(item.quantidade), Number(item.valor_unitario), `NF-e ${nfe.numero_nf}`, nfe.numero_nf, nfe.id)
        }
      }

      // 4. Re-sincronizar Contabilidade
      const { sincronizarLancamentoContabil, sincronizarNotaFiscalContabil } = await import('@/features/contabil/actions/accountingActions')
      
      await sincronizarNotaFiscalContabil(nfeId, 'nfe')
      const resSync = await sincronizarLancamentoContabil(financeiroId)

      // 5. Atualizar status da NF-e para 'escriturada' (Finalizado)
      const updatePayload: any = { 
        status_escrituracao: 'escriturada',
        status_conciliacao: 'conciliado',
        lancamento_financeiro_id: financeiroId,
        data_escrituracao: new Date().toISOString()
      }
      if (dataEfetiva) updatePayload.data_competencia = dataEfetiva

      const { error: upErr } = await sb.from('nfe_entradas').update(updatePayload).eq('id', nfeId)

      if (upErr) throw new Error(`Erro ao finalizar nota: ${upErr.message}`)

      return { error: resSync.error || null, success: true }
    } catch (err: any) {
      return { error: err.message || 'Erro na integração' }
    }
  }

  return { finalizarEscrituracao }
}
