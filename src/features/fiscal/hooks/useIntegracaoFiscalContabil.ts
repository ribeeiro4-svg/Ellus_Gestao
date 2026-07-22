import { useLancamentosContabeis } from '@/features/contabil/hooks/useLancamentosContabeis'
import { useProdutosEstoque } from '@/features/fiscal/hooks/useProdutosEstoque'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from '@/lib/hooks/useTenantId'

// Hash SHA-256 client-side (Web Crypto API)
async function gerarHashIntegridade(nfe: any, tenantId: string): Promise<string> {
  try {
    const payload = [
      nfe.chave_acesso || '',
      String(nfe.valor_total || ''),
      nfe.cnpj_emitente || '',
      nfe.nome_emitente || '',
      nfe.data_emissao || '',
      nfe.data_entrada || '',
      nfe.data_escrituracao || '',
      tenantId,
    ].join('|')
    const encoder = new TextEncoder()
    const data = encoder.encode(payload)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return ''
  }
}

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
  const finalizarEscrituracao = async (nfeId: string, financeiroId: string, dataEfetiva?: string, dataEscrituracao?: string) => {
    if (!tenantId) return { error: 'Tenant não identificado' }

    try {
      // 1. Buscar a NF-e e seus itens classificados
      const { data: nfe, error: nfeError } = await sb.from('nfe_entradas')
        .select('*, itens:nfe_entradas_itens(*)')
        .eq('id', nfeId)
        .single()

      if (nfeError || !nfe) return { error: 'NF-e não encontrada' }

      // Verificação de segurança: se já escriturada, bloquear mudança de datas (além do trigger SQL)
      if (nfe.status_escrituracao === 'escriturada') {
        if (dataEfetiva && nfe.data_entrada && dataEfetiva !== nfe.data_entrada.slice(0, 10)) {
          return { error: 'FISCAL INTEGRITY: data_entrada é imutável após escrituração.' }
        }
        if (dataEscrituracao && nfe.data_escrituracao && dataEscrituracao !== nfe.data_escrituracao.slice(0, 10)) {
          return { error: 'FISCAL INTEGRITY: data_escrituracao é imutável após escrituração.' }
        }
      }
      
      // 2. Criar Vínculo
      await sb.from('nfse_financeiro_vinculo').insert({
        tenant_id: tenantId,
        nfe_id: nfe.id,
        transacao_id: financeiroId,
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
              controla_estoque: ['2', '3', '31', '3.1', '10'].includes(item.destinacao_item),
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

        const deveLancarEstoque = ['2', '3', '31', '3.1', '10'].includes(item.destinacao_item)
        if (produtoId && deveLancarEstoque) {
          await estoque.registrarEntrada(produtoId, Number(item.quantidade), Number(item.valor_unitario), `NF-e ${nfe.numero_nf}`, nfe.numero_nf, nfe.id)
        }

        if (item.destinacao_item === '31' || item.destinacao_item === '3.1') {
          await sb.from('bens_duraveis').insert({
            tenant_id: tenantId,
            nfe_id: nfe.id,
            nfe_item_id: item.id,
            descricao: item.descricao_produto,
            codigo_interno: item.codigo_produto || null,
            data_aquisicao: dataEfetiva || new Date().toISOString().split('T')[0],
            valor_aquisicao: Number(item.valor_produto),
            vida_util_meses: null,
            status: 'pendente_analise',
            observacoes: 'Gerado automaticamente via Escrituração de NF-e.'
          })
        }
      }

      // 4. Re-sincronizar Contabilidade
      const { sincronizarLancamentoContabil, sincronizarNotaFiscalContabil } = await import('@/features/contabil/actions/accountingActions')
      
      await sincronizarNotaFiscalContabil(nfeId, 'nfe')
      const resSync = await sincronizarLancamentoContabil(financeiroId)

      // 5. Registrar Log de Integração (Unificado para Contabilidade)
      await sb.from('contabil_logs').insert({
        tenant_id: tenantId,
        acao: 'ESCRITURAÇÃO NFE',
        detalhes: `Escrituração concluída para nota ${nfe.numero_nf}. Lançamento financeiro vinculado e estoque atualizado.`
      })

      // 6. Atualizar status da NF-e para 'escriturada' (Finalizado)
      const updatePayload: any = { 
        status_escrituracao: 'escriturada',
        status_conciliacao: 'conciliada',
        lancamento_financeiro_id: financeiroId,
        data_escrituracao: dataEscrituracao || new Date().toISOString()
      }
      // Só grava data_entrada se ainda não estiver preenchida (imutabilidade)
      if (dataEfetiva && !nfe.data_entrada) updatePayload.data_entrada = dataEfetiva

      const { error: upErr } = await sb.from('nfe_entradas').update(updatePayload).eq('id', nfeId)
      if (upErr) throw new Error(`Erro ao finalizar nota: ${upErr.message}`)

      // Gerar hash de integridade SHA-256 e salvar
      try {
        const nfeParaHash = { ...nfe, ...updatePayload }
        const hash = await gerarHashIntegridade(nfeParaHash, tenantId)
        if (hash) {
          await sb.from('nfe_entradas').update({ hash_integridade: hash }).eq('id', nfeId)
        }
      } catch (hashErr) { console.warn('[finalizarEscrituracao] hash:', hashErr) }

      // Salvar snapshot no historico de versoes
      try {
        const { data: nfeAtual } = await sb.from('nfe_entradas').select('*').eq('id', nfeId).single()
        if (nfeAtual) {
          await sb.from('nfe_historico').insert({
            nfe_id: nfeId,
            tenant_id: tenantId,
            versao: nfeAtual.versao || 2,
            snapshot: nfeAtual,
            alterado_por: 'Escrituração',
          })
        }
      } catch (histErr) { console.warn('[finalizarEscrituracao] historico:', histErr) }

      return { error: resSync.error || null, success: true }
    } catch (err: any) {
      return { error: err.message || 'Erro na integração' }
    }
  }

  return { finalizarEscrituracao }
}
