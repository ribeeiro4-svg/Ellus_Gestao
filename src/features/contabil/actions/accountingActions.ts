'use server'
import { createServerSupabase } from '@/lib/supabase/server'
import { repararNumeracaoAction } from './documentLinkActions'
import { getMyTenantIdAction } from '@/app/actions/tenantActions'

/**
 * Normaliza string para comparação: remove acentos, converte para minúsculas e trim.
 * Ex: "ADESÃO" === "adesao" === "Adesão"
 */
function normalizar(str: string): string {
  return (str || '')
    .trim()
    .normalize('NFD')               // decompõe acentos ("ã" -> "a" + "~")
    .replace(/[\u0300-\u036f]/g, '') // remove os diacríticos
    .toLowerCase()
}

/**
 * Encontra ou cria conta contábil genérica "A Classificar" para o tipo dado.
 * Tenta 1º encontrar no plano existente, 2º criar nova conta.
 */
async function getOrCreateFallbackAccount(
  sb: any,
  plano: any[],
  tenantId: string,
  tipo: 'ingresso' | 'dispendio'
): Promise<{ id: string; codigo: string; descricao: string } | null> {
  const prefix = tipo === 'ingresso' ? '3' : '4'
  const codigoFallback = tipo === 'ingresso' ? '3.9.9.99' : '4.9.9.99'
  const descricaoFallback = tipo === 'ingresso'
    ? 'Outros Ingressos A Classificar'
    : 'Outros Dispêndios A Classificar'

  // 1. Procurar conta já existente com o código exato
  let conta = plano.find(p => p.codigo === codigoFallback)

  // 2. Procurar qualquer conta com "classificar" no nome no grupo correto
  if (!conta) {
    conta = plano.find(p =>
      normalizar(p.descricao || '').includes('classificar') &&
      (p.codigo || '').startsWith(prefix)
    )
  }

  // 3. Procurar qualquer conta que aceita lançamentos no grupo correto
  if (!conta) {
    conta = plano.find(p =>
      (p.codigo || '').startsWith(prefix) && p.aceita_lancamentos
    )
  }

  // 4. Criar conta genérica se não encontrada
  if (!conta) {
    try {
      const { data: nova, error: novErr } = await sb
        .from('plano_contas')
        .insert({
          tenant_id: tenantId,
          codigo: codigoFallback,
          descricao: descricaoFallback,
          aceita_lancamentos: true,
        })
        .select()
        .single()

      if (!novErr && nova) {
        plano.push(nova) // Adiciona ao contexto em memória
        conta = nova
        console.log(`[Contábil] Conta genérica criada: ${codigoFallback} - ${descricaoFallback}`)
      } else {
        console.warn('[Contábil] Erro ao criar conta fallback:', novErr?.message)
      }
    } catch (err: any) {
      console.warn('[Contábil] Exceção ao criar conta fallback:', err.message)
    }
  }

  return conta || null
}

/**
 * Carrega todos os mapeamentos e plano de contas UMA VEZ via RLS (sem filtro de tenant_id explícito)
 * A RLS garante que o usuário autenticado só veja seus dados.
 */
async function carregarContextoContabil() {
  const sb = await createServerSupabase()
  
  // Buscar configs SEM filtro de tenant – RLS faz o trabalho
  const { data: configs, error: configErr } = await sb
    .from('configuracoes_contabeis')
    .select('id, categoria_nome, conta_contabil_codigo, tipo, tenant_id')
  
  if (configErr) {
    console.error('[Contábil] Erro ao buscar configuracoes_contabeis:', configErr.message)
  }

  // Buscar plano de contas SEM filtro de tenant – RLS faz o trabalho
  const { data: plano, error: planoErr } = await sb
    .from('plano_contas')
    .select('id, codigo, descricao, aceita_lancamentos, tenant_id')
  
  if (planoErr) {
    console.error('[Contábil] Erro ao buscar plano_contas:', planoErr.message)
  }

  // Detectar tenant_id real a partir dos dados retornados pelo RLS
  const tenantFromConfig = configs?.[0]?.tenant_id
  const tenantFromPlano = plano?.[0]?.tenant_id
  const tenantId = tenantFromConfig || tenantFromPlano || await getMyTenantIdAction()

  return { configs: configs || [], plano: plano || [], tenantId }
}

/**
 * Sincroniza um lançamento individual (Financeiro -> Contábil)
 * Aceita contexto pré-carregado para evitar N+1 queries
 */
export async function sincronizarLancamentoContabil(
  financialId: string,
  contexto?: { configs: any[]; plano: any[]; tenantId: string }
) {
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Sessão expirada' }

  try {
    // 1. Buscar dados do financeiro
    const { data: l, error: lErr } = await sb
      .from('lancamentos')
      .select('id, data, status, descricao, categoria, valor, tipo')
      .eq('id', financialId)
      .single()

    if (lErr || !l) throw new Error('Lançamento não encontrado')

    // 2. Verificar se já existe (para evitar duplicidade)
    const { data: existing } = await sb.from('lancamentos_contabeis')
      .select('id, numero_lancamento')
      .eq('origem_id', financialId)
      .maybeSingle()
    if (existing) return { success: true, numero: existing.numero_lancamento, alreadySync: true }

    // 3. Usar contexto pré-carregado ou carregar agora
    const ctx = contexto || await carregarContextoContabil()
    const { configs, plano, tenantId } = ctx

    // 4. Encontrar mapeamento (fuzzy: ignora maiúsculas, minúsculas e acentos)
    const categoriaNorm = normalizar(l.categoria)
    let configMatch = configs.find(c => normalizar(c.categoria_nome) === categoriaNorm)

    // 5. Se não encontrou mapeamento, criar automaticamente para conta genérica
    if (!configMatch) {
      // Detectar natureza pelo tipo do lançamento
      const natureza: 'ingresso' | 'dispendio' =
        (l.tipo === 'receita' || Number(l.valor) > 0) ? 'ingresso' : 'dispendio'

      const fallbackConta = await getOrCreateFallbackAccount(sb, plano, tenantId, natureza)

      if (!fallbackConta) {
        return { error: `Categoria "${l.categoria}" sem mapeamento e sem conta genérica disponível no Plano de Contas` }
      }

      // Criar mapeamento permanente para uso futuro
      const novoMapping = {
        tenant_id: tenantId,
        categoria_nome: l.categoria,
        conta_contabil_codigo: fallbackConta.codigo,
        conta_contabil_nome: fallbackConta.descricao,
        tipo: natureza,
      }

      const { error: mapErr } = await sb
        .from('configuracoes_contabeis')
        .upsert(novoMapping, { onConflict: 'tenant_id,categoria_nome' })

      if (mapErr) {
        console.warn('[Contábil] Não foi possível salvar auto-mapeamento:', mapErr.message)
      } else {
        console.log(`[Contábil] Auto-mapeamento criado: "${l.categoria}" -> ${fallbackConta.codigo} (${natureza})`)
        // Adicionar ao contexto em memória para próximos registros da mesma execução
        configs.push({ ...novoMapping, id: 'auto' })
      }

      configMatch = { conta_contabil_codigo: fallbackConta.codigo, tipo: natureza, categoria_nome: l.categoria, tenant_id: tenantId }
    }

    const config = configMatch!

    // 5. Resolver contas no Plano (busca exata, depois normalizada)
    let mappedAccount = plano.find(p => p.codigo === config.conta_contabil_codigo)
      || plano.find(p => normalizar(p.codigo) === normalizar(config.conta_contabil_codigo))

    if (!mappedAccount) {
      // Conta configurada não existe no plano — usar conta genérica "A Classificar"
      const naturezaFallback: 'ingresso' | 'dispendio' =
        config.tipo === 'ingresso' ? 'ingresso' : 'dispendio'
      const fallbackPorCodigo = await getOrCreateFallbackAccount(sb, plano, tenantId, naturezaFallback)
      if (!fallbackPorCodigo) {
        return { error: `Conta "${config.conta_contabil_codigo}" não existe no Plano de Contas e não foi possível usar conta genérica` }
      }
      console.warn(`[Contábil] Conta "${config.conta_contabil_codigo}" não encontrada — usando fallback: ${fallbackPorCodigo.codigo}`)
      mappedAccount = fallbackPorCodigo
    }

    const bankAccount = plano.find(p => p.codigo === '1.1.1.02')
      || plano.find(p => p.codigo === '1.1.1.01')
      || plano.find(p => (p.codigo || '').startsWith('1.1.1') && p.aceita_lancamentos)
      || plano.find(p => (p.codigo || '').startsWith('1.1') && p.aceita_lancamentos)

    if (!bankAccount) {
      return { error: 'Conta Banco/Caixa não encontrada no grupo 1.1 do Plano de Contas' }
    }

    // 6. Definir partidas (Débito/Crédito)
    let contaDebitoId, contaCreditoId
    if (config.tipo === 'ingresso') {
      contaDebitoId = bankAccount.id      // D: Banco/Caixa
      contaCreditoId = mappedAccount.id   // C: Receita
    } else {
      contaDebitoId = mappedAccount.id    // D: Despesa
      contaCreditoId = bankAccount.id     // C: Banco/Caixa
    }

    // 7. Gerar número sequencial para o ano
    const ano = new Date(l.data).getFullYear()
    const { data: ultimosLancs } = await sb
      .from('lancamentos_contabeis')
      .select('numero_lancamento')
      .eq('tenant_id', tenantId)
      .like('numero_lancamento', `${ano}/%`)
      .order('numero_lancamento', { ascending: false })
      .limit(1)

    let maxSeq = 0
    if (ultimosLancs && ultimosLancs.length > 0) {
      const parts = (ultimosLancs[0].numero_lancamento || '').split('/')
      if (parts.length === 2) maxSeq = parseInt(parts[1], 10) || 0
    }
    const seq = String(maxSeq + 1).padStart(6, '0')
    const numeroLancamento = `${ano}/${seq}`

    // 8. Inserir Capa do Lançamento
    const insertData: any = {
      tenant_id: tenantId,
      data_lancamento: l.data,
      data_competencia: l.data,
      numero_lancamento: numeroLancamento,
      historico: `${config.tipo === 'ingresso' ? 'REC' : 'PAG'} - ${l.descricao || l.categoria}`,
      origem_id: l.id,
      origem_tipo: 'financeiro',
      status: 'confirmado',
      usuario_nome: user.email,
    }

    const { data: lancContabil, error: cErr } = await sb
      .from('lancamentos_contabeis')
      .insert(insertData)
      .select()
      .single()

    if (cErr) throw cErr

    // 9. Inserir Partidas
    const partidas = [
      {
        lancamento_id: lancContabil.id,
        conta_id: contaDebitoId,
        tipo_partida: 'D',
        valor: l.valor,
        historico_partida: l.descricao || l.categoria,
        ordem: 1,
      },
      {
        lancamento_id: lancContabil.id,
        conta_id: contaCreditoId,
        tipo_partida: 'C',
        valor: l.valor,
        historico_partida: l.descricao || l.categoria,
        ordem: 2,
      }
    ]

    const { error: pErr } = await sb.from('lancamentos_partidas').insert(partidas)
    if (pErr) {
      // Reverter capa se partidas falharem
      await sb.from('lancamentos_contabeis').delete().eq('id', lancContabil.id)
      throw pErr
    }

    return { success: true, numero: numeroLancamento }
  } catch (err: any) {
    console.error('[Contábil] Erro sincronizarLancamentoContabil:', err)
    return { error: err.message }
  }
}

/**
 * Sincroniza uma nota fiscal individual (Fiscal -> Contábil)
 */
export async function sincronizarNotaFiscalContabil(docId: string, type: 'nfse' | 'nfe') {
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Sessão expirada' }

  try {
    const table = type === 'nfse' ? 'nfse_entradas' : 'nfe_entradas'
    const { data: doc } = await sb.from(table).select('*').eq('id', docId).single()
    if (!doc) throw new Error('Documento não encontrado')

    const { data: existing } = await sb.from('lancamentos_contabeis').select('id').eq('origem_id', docId).maybeSingle()
    if (existing) return { success: true, alreadySync: true }

    const ctx = await carregarContextoContabil()
    const { configs, plano, tenantId } = ctx

    const catNome = type === 'nfse' ? 'SERVIÇOS PRESTADOS' : 'COMPRA DE MERCADORIAS'
    const config = configs.find(c => normalizar(c.categoria_nome) === normalizar(catNome))
    if (!config) return { error: `Mapeamento para "${catNome}" não configurado` }

    const mappedAccount = plano.find(p => p.codigo === config.conta_contabil_codigo)
    const bankAccount = plano.find(p => p.codigo === '1.1.1.02')
      || plano.find(p => p.codigo === '1.1.1.01')
      || plano.find(p => (p.codigo || '').startsWith('1.1.1') && p.aceita_lancamentos)

    if (!mappedAccount || !bankAccount) return { error: 'Contas não encontradas no Plano de Contas' }

    const ano = new Date(doc.data_emissao).getFullYear()
    const { data: ultimosLancs } = await sb
      .from('lancamentos_contabeis')
      .select('numero_lancamento')
      .eq('tenant_id', tenantId)
      .like('numero_lancamento', `${ano}/%`)
      .order('numero_lancamento', { ascending: false })
      .limit(1)

    let maxSeq = 0
    if (ultimosLancs && ultimosLancs.length > 0) {
      const parts = (ultimosLancs[0].numero_lancamento || '').split('/')
      if (parts.length === 2) maxSeq = parseInt(parts[1], 10) || 0
    }
    const seq = String(maxSeq + 1).padStart(6, '0')
    const numeroLancamento = `${ano}/${seq}`

    const { data: lancContabil, error: cErr } = await sb.from('lancamentos_contabeis').insert({
      tenant_id: tenantId,
      data_lancamento: doc.data_emissao,
      data_competencia: doc.data_emissao,
      numero_lancamento: numeroLancamento,
      historico: `FISCAL - ${type.toUpperCase()} ${doc.numero_nfse || doc.numero_nf || ''} - ${doc.prestador_nome || doc.nome_emitente || ''}`,
      origem_id: doc.id,
      origem_tipo: type,
      status: 'confirmado',
      usuario_nome: user.email,
    }).select().single()

    if (cErr) throw cErr

    const v = doc.valor_servicos || doc.valor_produtos || doc.valor_total || 0

    let contaDebitoId, contaCreditoId
    if (config.tipo === 'ingresso') {
      contaDebitoId = bankAccount.id
      contaCreditoId = mappedAccount.id
    } else {
      contaDebitoId = mappedAccount.id
      contaCreditoId = bankAccount.id
    }

    await sb.from('lancamentos_partidas').insert([
      { lancamento_id: lancContabil.id, conta_id: contaDebitoId, tipo_partida: 'D', valor: v, historico_partida: 'Nota Fiscal', ordem: 1 },
      { lancamento_id: lancContabil.id, conta_id: contaCreditoId, tipo_partida: 'C', valor: v, historico_partida: 'Nota Fiscal', ordem: 2 }
    ])

    return { success: true, numero: numeroLancamento }
  } catch (err: any) {
    console.error('[Contábil] Erro sincronizarNotaFiscalContabil:', err)
    return { error: err.message }
  }
}

/**
 * Sincroniza todos os lançamentos de um período (Financeiro -> Contábil)
 */
export async function sincronizarPeriodoContabil(dataInicio: string) {
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Sessão expirada' }

  // Carregar contexto UMA VEZ (configs + plano via RLS)
  const ctx = await carregarContextoContabil()
  const { tenantId } = ctx

  console.log(`[Contábil] sincronizarPeriodoContabil - tenantId: ${tenantId}, configs: ${ctx.configs.length}, plano: ${ctx.plano.length}`)

  const { data: items, error } = await sb
    .from('lancamentos')
    .select('id, data, status, descricao, categoria')
    .eq('tenant_id', tenantId)
    .gte('data', dataInicio)
    .order('data', { ascending: true })

  if (error) return { error: error.message }
  if (!items || items.length === 0) return { success: true, total: 0, success_count: 0, skippedStatus: 0, skippedMapping: 0, alreadySync: 0, errors: [] }

  const results = {
    total: items.length,
    success: 0,
    alreadySync: 0,
    skippedStatus: 0,
    skippedMapping: 0,
    errors: [] as string[]
  }

  for (const l of items) {
    const status = (l.status || '').toLowerCase()
    if (status !== 'pago' && status !== 'conciliado') {
      results.skippedStatus++
      continue
    }

    // Verificar se já existe
    const { data: existing } = await sb.from('lancamentos_contabeis').select('id').eq('origem_id', l.id).maybeSingle()
    if (existing) {
      results.alreadySync++
      continue
    }

    // Passar contexto para evitar N+1 queries
    const res = await sincronizarLancamentoContabil(l.id, ctx)
    if (res.error) {
      if (res.error.includes('Mapeamento não encontrado')) results.skippedMapping++
      else results.errors.push(`${l.descricao}: ${res.error}`)
    } else {
      results.success++
    }
  }

  return { ...results, success: true, tenantId }
}

/**
 * Exclui lançamentos contábeis em lote
 */
export async function excluirLancamentosLoteAction(ids: string[], senha: string) {
  if (senha !== '19072425') return { error: 'Senha de exclusão incorreta.' }
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Sessão expirada' }

  try {
    await sb.from('lancamentos_partidas').delete().in('lancamento_id', ids)
    const { error: delErr } = await sb.from('lancamentos_contabeis').delete().in('id', ids)
    if (delErr) throw delErr
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

/**
 * Sincroniza todas as notas fiscais (NFSe e NFe) do período
 */
export async function sincronizarFiscalContabilLote(dataInicio: string) {
  const sb = await createServerSupabase()
  const ctx = await carregarContextoContabil()
  const { tenantId } = ctx

  const { data: nfses } = await sb.from('nfse_entradas').select('id, data_emissao').eq('tenant_id', tenantId).gte('data_emissao', dataInicio).order('data_emissao', { ascending: true })
  let nfseCount = 0
  if (nfses) { for (const n of nfses) { const res = await sincronizarNotaFiscalContabil(n.id, 'nfse'); if (!res.error) nfseCount++ } }

  const { data: nfes } = await sb.from('nfe_entradas').select('id, data_emissao').eq('tenant_id', tenantId).gte('data_emissao', dataInicio).order('data_emissao', { ascending: true })
  let nfeCount = 0
  if (nfes) { for (const n of nfes) { const res = await sincronizarNotaFiscalContabil(n.id, 'nfe'); if (!res.error) nfeCount++ } }

  return { nfseCount, nfeCount }
}

/**
 * AÇÃO COMBINADA: Integração Fiscal + Contábil
 */
export async function integracaoFiscalContabilTotalAction(dataInicio: string = '2026-01-01') {
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Sessão expirada' }

  const resFin: any = await sincronizarPeriodoContabil(dataInicio)
  const resFis: any = await sincronizarFiscalContabilLote(dataInicio)

  return {
    success: true,
    financeiro: resFin,
    fiscal: resFis,
    tenantId: resFin.tenantId,
    resumo: `Financeiro: ${resFin.success || 0} novos, ${resFin.skippedStatus || 0} pulados por status, ${resFin.skippedMapping || 0} sem mapeamento. Fiscal: ${(resFis.nfseCount || 0) + (resFis.nfeCount || 0)} notas.`
  }
}

/**
 * Repara numeração sequencial dos lançamentos contábeis
 * (Re-exportada de documentLinkActions para manter compatibilidade)
 */
export { repararNumeracaoAction }
