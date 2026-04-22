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
  const finalizarEscrituracao = async (nfeId: string) => {
    if (!tenantId) return { error: 'Tenant não identificado' }

    // 1. Buscar a NF-e e seus itens classificados
    const { data: nfe, error: nfeError } = await sb.from('nfe_entradas')
      .select('*, itens:nfe_entradas_itens(*)')
      .eq('id', nfeId)
      .single()

    if (nfeError || !nfe) return { error: 'NF-e não encontrada' }
    if (nfe.status_escrituracao === 'concluida') return { error: 'Escrituração já finalizada' }

    // 2. Verificar se todos os itens estão classificados
    const itensPendentes = nfe.itens.filter((i: any) => !i.classificado || !i.cfop_escrituracao || !i.destinacao_item)
    if (itensPendentes.length > 0) {
      const lista = itensPendentes.map((i: any) => `Item ${i.numero_item}: ${i.descricao_produto}`).join('\n')
      return { error: `Existem ${itensPendentes.length} itens pendentes de classificação completa (CFOP e Destinação):\n${lista}` }
    }

    try {
      // 3. Gerar Lançamento Contábil
      // Estrutura simplificada para Associações:
      // Débito: Conta de Despesa ou Ativo (conforme item.conta_contabil_id ou destinacao)
      // Crédito: Fornecedores (Passivo) ou Caixa/Banco (se já pago)
      
      const partidasContabeis: any[] = []
      let totalNFe = Number(nfe.valor_total || 0)

      // Crédito principal (Fornecedores)
      // TODO: Buscar conta de fornecedores padrão do tenant ou específica do emitente
      const { data: config } = await sb.from('configuracoes_contabeis')
        .select('conta_fornecedores_id')
        .eq('tenant_id', tenantId)
        .single()
      
      const contaFornecedorId = config?.conta_fornecedores_id 
        // Fallback: tentar encontrar conta "Fornecedores" no plano
        || (await sb.from('plano_contas')
            .select('id')
            .eq('tenant_id', tenantId)
            .ilike('descricao', '%Fornecedores%')
            .eq('tipo', 'analitica')
            .limit(1)).data?.[0]?.id

      if (!contaFornecedorId) {
        return { error: 'Conta contábil de Fornecedores não configurada no plano.' }
      }

      // Adicionar partidas de Débito (Itens)
      for (const item of nfe.itens) {
        if (!item.conta_contabil_id) {
          return { error: `Item "${item.descricao_produto}" sem conta contábil definida.` }
        }

        partidasContabeis.push({
          contaId: item.conta_contabil_id,
          tipo: 'D',
          valor: Number(item.valor_produto || 0),
          historico: `Vlr Ref. ${item.descricao_produto} - NF ${nfe.numero_nf}`
        })

        // 4. Integração com Produtos e Estoque
        // Cadastro automático de TODOS os produtos da NF
        let produtoId = item.produto_vinc_id

        // Se não tem vínculo, tenta buscar por descrição ou CRIA um novo (Sempre cria para controle total)
        if (!produtoId) {
          const { data: existente } = await sb.from('produtos')
            .select('id')
              .eq('tenant_id', tenantId)
              .eq('descricao', item.descricao_produto)
              .limit(1)
              .single()
            
          if (existente) {
            produtoId = existente.id
          } else {
            // Criar o produto automaticamente (Independente da destinação)
            const { error: createErr } = await estoque.criarProduto({
              descricao: item.descricao_produto,
              ncm: item.ncm || '',
              unidade_medida: item.unidade_medida || 'UN',
              tipo_produto: item.destinacao_item === '4' ? 'imobilizado' : 'mercadoria',
              codigo_fornecedor: item.codigo_produto || '',
              codigo_ean: item.codigo_ean || '',
              destinacao_padrao: item.destinacao_item, // Salva a destinação escolhida
              controla_estoque: ['4', '7', '8'].includes(item.destinacao_item), // Apenas esses controlam saldo
              estoque_minimo: 0,
              estoque_maximo: null,
              ponto_pedido: null,
              custo_medio_ponderado: Number(item.valor_unitario),
              ultimo_custo_compra: Number(item.valor_unitario),
              data_ultima_compra: new Date().toISOString().split('T')[0],
              ativo: true
            })

            if (!createErr) {
              const { data: novoProd } = await sb.from('produtos')
                .select('id')
                .eq('tenant_id', tenantId)
                .eq('descricao', item.descricao_produto)
                .single()
              produtoId = novoProd?.id
            }
          }
        }

        // Registrar entrada no estoque apenas se for destinação de controle (Imobilizado, Revenda, Distribuição)
        const deveLancarEstoque = ['4', '7', '8'].includes(item.destinacao_item)
        if (produtoId && deveLancarEstoque) {
          await estoque.registrarEntrada(
            produtoId,
            Number(item.quantidade),
            Number(item.valor_unitario),
            `Entrada automática via Escrituração NF-e ${nfe.numero_nf} - ${nfe.nome_emitente}`,
            nfe.numero_nf,
            nfe.id
          )
        }
      }

      // Adicionar partida de Crédito (Total da NF)
      partidasContabeis.push({
        contaId: contaFornecedorId,
        tipo: 'C',
        valor: totalNFe,
        historico: `Vlr Total NF ${nfe.numero_nf} - ${nfe.nome_emitente}`
      })

      // Inserir lançamento
      const resLanc = await lancContabil.inserir({
        data: nfe.data_entrada || nfe.data_emissao,
        historico: `Escrituração Fiscal NF ${nfe.numero_nf} - ${nfe.nome_emitente}`,
        documentoTipo: 'NF',
        documentoNumero: nfe.numero_nf,
        origemTipo: 'fiscal',
        origemId: nfe.id,
        partidas: partidasContabeis
      })

      if (resLanc.error) throw new Error(resLanc.error)

      // 5. Atualizar status da NF-e
      await sb.from('nfe_entradas')
        .update({ 
          status_escrituracao: 'concluida',
          status_conciliacao: 'conciliado',
          lancamento_contabil_id: resLanc.id
        })
        .eq('id', nfeId)

      return { error: null, lancamentoId: resLanc.id }

    } catch (err: any) {
      console.error('Erro na integração fiscal-contábil:', err)
      return { error: err.message || 'Erro interno na integração' }
    }
  }

  return { finalizarEscrituracao }
}
