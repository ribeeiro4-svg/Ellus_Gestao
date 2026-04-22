import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from '@/lib/hooks/useTenantId'

export interface Produto {
  id: string
  tenant_id: string
  codigo_interno: string
  codigo_fornecedor: string
  codigo_ean: string
  descricao: string
  ncm: string
  unidade_medida: string
  tipo_produto: string
  destinacao_padrao: string
  controla_estoque: boolean
  estoque_minimo: number
  estoque_maximo: number | null
  ponto_pedido: number | null
  custo_medio_ponderado: number
  ultimo_custo_compra: number
  data_ultima_compra: string | null
  ativo: boolean
  saldo?: number
}

export interface Movimentacao {
  id: string
  produto_id: string
  tipo_mov: string
  natureza: string
  quantidade: number
  custo_unitario: number
  saldo_qtd_antes: number
  cmp_antes: number
  saldo_qtd_depois: number
  cmp_depois: number
  historico: string
  documento_referencia: string
  data_movimento: string
  created_at: string
  produto?: Produto
}

export interface Baixa {
  id: string
  numero_requisicao: string
  tipo: string
  data_baixa: string
  solicitante: string
  projeto_ref: string
  beneficiario_nome: string
  status: string
  observacoes: string
  created_at: string
  itens?: BaixaItem[]
}

export interface BaixaItem {
  id: string
  baixa_id: string
  produto_id: string
  quantidade: number
  custo_unitario: number
  observacao: string
  produto?: Produto
}

export function useProdutosEstoque() {
  const tenantId = useTenantId()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [baixas, setBaixas] = useState<Baixa[]>([])
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetchProdutos = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      // Buscar produtos com saldos (join com estoque_saldo)
      const { data: prods } = await sb.from('produtos')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('ativo', true)
        .order('descricao')

      const { data: saldos } = await sb.from('estoque_saldo')
        .select('*')
        .eq('tenant_id', tenantId)

      const produtosComSaldo = (prods ?? []).map(p => ({
        ...p,
        saldo: saldos?.find(s => s.produto_id === p.id)?.quantidade ?? 0,
      }))

      setProdutos(produtosComSaldo)
    } catch (err) {
      console.error('Error fetching produtos:', err)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const fetchMovimentacoes = useCallback(async (produtoId?: string) => {
    if (!tenantId) return
    let query = sb.from('estoque_movimentacoes')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('data_movimento', { ascending: false })
      .limit(200)

    if (produtoId) query = query.eq('produto_id', produtoId)

    const { data } = await query
    setMovimentacoes(data ?? [])
  }, [tenantId])

  const fetchBaixas = useCallback(async () => {
    if (!tenantId) return
    const { data } = await sb.from('estoque_baixas')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100)
    setBaixas(data ?? [])
  }, [tenantId])

  useEffect(() => {
    fetchProdutos()
    fetchMovimentacoes()
    fetchBaixas()
  }, [fetchProdutos, fetchMovimentacoes, fetchBaixas])

  // ── PRODUTOS ────────────────────────────────────────────────────────────────
  const criarProduto = async (data: Omit<Produto, 'id' | 'tenant_id' | 'saldo' | 'codigo_interno'>) => {
    // Gerar código interno automático
    const seq = (produtos.length + 1).toString().padStart(5, '0')
    const codigoInterno = `PROD-${seq}`

    const { error } = await sb.from('produtos').insert({
      ...data,
      codigo_interno: codigoInterno,
      tenant_id: tenantId,
    })
    if (!error) fetchProdutos()
    return { error }
  }

  const atualizarProduto = async (id: string, data: Partial<Produto>) => {
    const { error } = await sb.from('produtos').update(data).eq('id', id)
    if (!error) fetchProdutos()
    return { error }
  }

  // ── ENTRADAS NO ESTOQUE ───────────────────────────────────────────────────
  const registrarEntrada = async (
    produtoId: string,
    quantidade: number,
    custoUnitario: number,
    historico: string,
    docRef: string,
    nfeEntradaId?: string
  ) => {
    const produto = produtos.find(p => p.id === produtoId)
    if (!produto) return { error: 'Produto não encontrado' }

    const saldoAtual = produto.saldo ?? 0
    const cmpAtual = produto.custo_medio_ponderado ?? 0

    // Calcular novo CMP — método Custo Médio Ponderado (NBC TG 16 / CPC 16)
    const novoCMP = saldoAtual > 0
      ? (saldoAtual * cmpAtual + quantidade * custoUnitario) / (saldoAtual + quantidade)
      : custoUnitario

    const novoSaldo = saldoAtual + quantidade

    // Registrar movimentação
    const { error: movError } = await sb.from('estoque_movimentacoes').insert({
      tenant_id: tenantId,
      produto_id: produtoId,
      tipo_mov: 'ENTRADA',
      natureza: 'compra_nfe',
      quantidade,
      custo_unitario: custoUnitario,
      saldo_qtd_antes: saldoAtual,
      cmp_antes: cmpAtual,
      saldo_qtd_depois: novoSaldo,
      cmp_depois: novoCMP,
      historico,
      documento_referencia: docRef,
      nfe_entrada_id: nfeEntradaId ?? null,
      data_movimento: new Date().toISOString().split('T')[0],
    })
    if (movError) return { error: movError.message }

    // Atualizar saldo
    const { data: saldoExist } = await sb.from('estoque_saldo')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('produto_id', produtoId)
      .is('deposito_id', null)
      .limit(1)

    if (saldoExist && saldoExist.length > 0) {
      await sb.from('estoque_saldo').update({
        quantidade: novoSaldo,
        custo_medio: novoCMP,
        data_ultima_mov: new Date().toISOString().split('T')[0],
      }).eq('id', saldoExist[0].id)
    } else {
      await sb.from('estoque_saldo').insert({
        tenant_id: tenantId,
        produto_id: produtoId,
        quantidade: novoSaldo,
        custo_medio: novoCMP,
        data_ultima_mov: new Date().toISOString().split('T')[0],
      })
    }

    // Atualizar produto
    await sb.from('produtos').update({
      custo_medio_ponderado: novoCMP,
      ultimo_custo_compra: custoUnitario,
      data_ultima_compra: new Date().toISOString().split('T')[0],
    }).eq('id', produtoId)

    fetchProdutos()
    fetchMovimentacoes()
    return { error: null }
  }

  // ── BAIXAS / SAÍDAS ───────────────────────────────────────────────────────
  const criarBaixa = async (
    tipo: string,
    itens: { produtoId: string; quantidade: number; observacao?: string }[],
    dadosExtras: {
      solicitante?: string
      projetoRef?: string
      beneficiarioNome?: string
      beneficiarioCPF?: string
      observacoes?: string
    }
  ) => {
    // Gerar número de requisição
    const seq = (baixas.length + 1).toString().padStart(5, '0')
    const numeroReq = `REQ-${new Date().getFullYear()}-${seq}`

    const { data: baixaData, error: baixaError } = await sb.from('estoque_baixas').insert({
      tenant_id: tenantId,
      numero_requisicao: numeroReq,
      tipo,
      data_baixa: new Date().toISOString().split('T')[0],
      solicitante: dadosExtras.solicitante ?? '',
      projeto_ref: dadosExtras.projetoRef ?? '',
      beneficiario_nome: dadosExtras.beneficiarioNome ?? '',
      beneficiario_cpf: dadosExtras.beneficiarioCPF ?? '',
      status: 'atendida',
      observacoes: dadosExtras.observacoes ?? '',
    }).select().single()

    if (baixaError) return { error: baixaError.message }

    for (const item of itens) {
      const produto = produtos.find(p => p.id === item.produtoId)
      if (!produto) continue

      const saldoAtual = produto.saldo ?? 0
      const cmpAtual = produto.custo_medio_ponderado ?? 0

      if (item.quantidade > saldoAtual) {
        return { error: `Saldo insuficiente para o produto: ${produto.descricao}` }
      }

      const novoSaldo = saldoAtual - item.quantidade

      await sb.from('estoque_baixas_itens').insert({
        baixa_id: baixaData.id,
        produto_id: item.produtoId,
        quantidade: item.quantidade,
        custo_unitario: cmpAtual,
        observacao: item.observacao ?? '',
      })

      await sb.from('estoque_movimentacoes').insert({
        tenant_id: tenantId,
        produto_id: item.produtoId,
        tipo_mov: 'SAIDA',
        natureza: tipo,
        quantidade: item.quantidade,
        custo_unitario: cmpAtual,
        saldo_qtd_antes: saldoAtual,
        cmp_antes: cmpAtual,
        saldo_qtd_depois: novoSaldo,
        cmp_depois: cmpAtual,
        historico: `${tipo.replace('_', ' ').toUpperCase()} — ${dadosExtras.beneficiarioNome || dadosExtras.projetoRef || dadosExtras.solicitante || 'Interno'}`,
        documento_referencia: numeroReq,
        projeto_ref: dadosExtras.projetoRef ?? '',
        beneficiario_nome: dadosExtras.beneficiarioNome ?? '',
        data_movimento: new Date().toISOString().split('T')[0],
      })

      // Atualizar saldo
      await sb.from('estoque_saldo')
        .update({ quantidade: novoSaldo, data_ultima_mov: new Date().toISOString().split('T')[0] })
        .eq('tenant_id', tenantId)
        .eq('produto_id', item.produtoId)
        .is('deposito_id', null)

      await sb.from('produtos').update({ custo_medio_ponderado: cmpAtual }).eq('id', item.produtoId)
    }

    fetchProdutos()
    fetchMovimentacoes()
    fetchBaixas()
    return { error: null, numeroReq }
  }

  // Ajuste de inventário
  const ajustarInventario = async (produtoId: string, novaQuantidade: number, motivo: string) => {
    const produto = produtos.find(p => p.id === produtoId)
    if (!produto) return { error: 'Produto não encontrado' }

    const saldoAtual = produto.saldo ?? 0
    const diferenca = novaQuantidade - saldoAtual
    const tipoMov = diferenca >= 0 ? 'ENTRADA' : 'SAIDA'
    const qtd = Math.abs(diferenca)

    if (qtd === 0) return { error: null }

    await sb.from('estoque_movimentacoes').insert({
      tenant_id: tenantId,
      produto_id: produtoId,
      tipo_mov: tipoMov,
      natureza: tipoMov === 'ENTRADA' ? 'ajuste_inventario_mais' : 'ajuste_inventario_menos',
      quantidade: qtd,
      custo_unitario: produto.custo_medio_ponderado,
      saldo_qtd_antes: saldoAtual,
      cmp_antes: produto.custo_medio_ponderado,
      saldo_qtd_depois: novaQuantidade,
      cmp_depois: produto.custo_medio_ponderado,
      historico: `Ajuste de inventário — ${motivo}`,
      documento_referencia: 'INVENTARIO',
      data_movimento: new Date().toISOString().split('T')[0],
    })

    await sb.from('estoque_saldo')
      .update({ quantidade: novaQuantidade })
      .eq('tenant_id', tenantId)
      .eq('produto_id', produtoId)
      .is('deposito_id', null)

    fetchProdutos()
    fetchMovimentacoes()
    return { error: null }
  }

  const sincronizarProdutosComNotas = async () => {
    if (!tenantId) return { error: 'Tenant não identificado' }
    
    try {
      // 1. Buscar todos os itens de notas que já foram classificados
      const { data: itensNfe, error: errItens } = await sb.from('nfe_entradas_itens')
        .select('*, nfe:nfe_entradas(status_escrituracao)')
        .eq('classificado', true)
        .eq('tenant_id', tenantId)

      if (errItens) throw errItens
      if (!itensNfe || itensNfe.length === 0) return { message: 'Nenhuma nota escriturada encontrada para sincronizar.' }

      // 2. Filtrar apenas itens que NÃO estão vinculados a produtos
      const itensSemCadastro = itensNfe.filter(item => {
        const jaExiste = produtos.some(p => 
          p.descricao === item.descricao_produto || 
          (p.codigo_fornecedor && p.codigo_fornecedor === item.codigo_produto)
        )
        return !jaExiste && !item.produto_vinc_id
      })

      if (itensSemCadastro.length === 0) return { message: 'Todos os produtos das notas já estão cadastrados.' }

      // 3. Criar os produtos faltantes (Remover duplicados na própria lista da NF)
      const unicos = Array.from(new Set(itensSemCadastro.map(i => i.descricao_produto)))
        .map(desc => itensSemCadastro.find(i => i.descricao_produto === desc))

      let criados = 0
      for (const item of unicos) {
        if (!item) continue
        const { error } = await criarProduto({
          descricao: item.descricao_produto,
          ncm: item.ncm || '',
          unidade_medida: item.unidade_medida || 'UN',
          tipo_produto: item.destinacao_item === '4' ? 'imobilizado' : 'mercadoria',
          codigo_fornecedor: item.codigo_produto || '',
          codigo_ean: item.codigo_ean || '',
          destinacao_padrao: item.destinacao_item,
          controla_estoque: ['4', '7', '8'].includes(item.destinacao_item),
          estoque_minimo: 0,
          estoque_maximo: null,
          ponto_pedido: null,
          custo_medio_ponderado: Number(item.valor_unitario),
          ultimo_custo_compra: Number(item.valor_unitario),
          data_ultima_compra: new Date().toISOString().split('T')[0],
          ativo: true
        })
        if (!error) criados++
      }

      await fetchProdutos()
      return { message: `${criados} novos produtos cadastrados com sucesso!` }

    } catch (err: any) {
      console.error('Erro na sincronização:', err)
      return { error: err.message }
    }
  }

  // Stats
  const stats = {
    totalProdutos: produtos.length,
    produtosAbaixoMinimo: produtos.filter(p => (p.saldo ?? 0) < p.estoque_minimo && p.controla_estoque).length,
    valorTotalEstoque: produtos.reduce((acc, p) => acc + (p.saldo ?? 0) * (p.custo_medio_ponderado ?? 0), 0),
    produtosSemEstoque: produtos.filter(p => (p.saldo ?? 0) === 0 && p.controla_estoque).length,
  }

  return {
    produtos, movimentacoes, baixas, loading, stats,
    criarProduto, atualizarProduto,
    registrarEntrada, criarBaixa, ajustarInventario, sincronizarProdutosComNotas,
    fetchMovimentacoes,
    refresh: fetchProdutos,
  }
}
