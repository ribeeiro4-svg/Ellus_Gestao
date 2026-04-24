'use server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function encerrarExercicioAction(ano: number) {
  const sb = await createServerSupabase()

  // 1. Identificar o tenant_id via lançamento existente (reutiliza a mesma técnica)
  const { data: sample } = await sb
    .from('lancamentos_contabeis')
    .select('tenant_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sample?.tenant_id) {
    return { error: 'Tenant não identificado. Certifique-se de que há lançamentos no Livro Diário.' }
  }
  const tenantId = sample.tenant_id

  // 2. Verificar se já existe encerramento para este ano (anti-duplicidade)
  const dataEncerramento = `${ano}-12-31`
  const dataInicioAno = `${ano}-01-01`

  const { data: existing } = await sb
    .from('lancamentos_contabeis')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('tipo', 'encerramento')
    .gte('data_lancamento', dataInicioAno)
    .lte('data_lancamento', dataEncerramento)
    .maybeSingle()

  if (existing) {
    return { error: `O exercício de ${ano} já foi encerrado. Para refazê-lo, estorne o lançamento de encerramento primeiro.` }
  }

  // 3. Buscar todos os saldos das contas do Grupo 3 (Ingressos) e Grupo 4 (Dispêndios) do ano
  const { data: partidas } = await sb
    .from('lancamentos_partidas')
    .select(`
      conta_id,
      tipo_partida,
      valor,
      lancamento:lancamento_id(data_competencia, status, tenant_id, tipo)
    `)
    .eq('lancamento.tenant_id', tenantId)
    .eq('lancamento.status', 'confirmado')
    .neq('lancamento.tipo', 'encerramento')
    .gte('lancamento.data_competencia', dataInicioAno)
    .lte('lancamento.data_competencia', dataEncerramento)

  if (!partidas || partidas.length === 0) {
    return { error: `Nenhum lançamento encontrado para o exercício de ${ano}.` }
  }

  // 4. Buscar todos os códigos de contas para classificar (apenas grupos 3 e 4)
  const { data: todasContas } = await sb
    .from('plano_contas')
    .select('id, codigo, natureza')
    .eq('tenant_id', tenantId)
    .or('codigo.like.3.%,codigo.like.4.%')

  if (!todasContas || todasContas.length === 0) {
    return { error: 'Plano de Contas não inicializado. Inicialize o Plano de Contas primeiro.' }
  }

  const contasMap: Record<string, { codigo: string; natureza: string }> = {}
  for (const c of todasContas) {
    contasMap[c.id] = { codigo: c.codigo, natureza: c.natureza }
  }

  // 5. Apurar saldo por conta analítica (Grupo 3 e 4)
  const saldosPorConta: Record<string, { debitos: number; creditos: number; codigo: string; natureza: string }> = {}

  for (const p of partidas as any[]) {
    const conta = contasMap[p.conta_id]
    if (!conta) continue
    // Processar apenas contas dos grupos 3 e 4
    if (!conta.codigo.startsWith('3.') && !conta.codigo.startsWith('4.')) continue

    if (!saldosPorConta[p.conta_id]) {
      saldosPorConta[p.conta_id] = { debitos: 0, creditos: 0, codigo: conta.codigo, natureza: conta.natureza }
    }
    if (p.tipo_partida === 'D') saldosPorConta[p.conta_id].debitos += Number(p.valor)
    else saldosPorConta[p.conta_id].creditos += Number(p.valor)
  }

  // 6. Montar as partidas do lançamento de zeramento
  // Para Ingressos (natureza credora): saldo = creditos - debitos. Zeramos debitando (invertendo)
  // Para Dispêndios (natureza devedora): saldo = debitos - creditos. Zeramos creditando (invertendo)
  const partidasZeramento: Array<{
    contaId: string
    tipo: 'D' | 'C'
    valor: number
    historico: string
  }> = []

  let totalIngressos = 0
  let totalDispendios = 0

  for (const [contaId, s] of Object.entries(saldosPorConta)) {
    let saldoLiquido: number
    let tipoPartida: 'D' | 'C'

    if (s.codigo.startsWith('3.')) {
      // Ingresso — natureza credora: saldo = C - D
      saldoLiquido = s.creditos - s.debitos
      if (saldoLiquido <= 0.001) continue // sem saldo, ignora
      tipoPartida = 'D' // para zerar uma conta credora, debitamos
      totalIngressos += saldoLiquido
    } else {
      // Dispêndio — natureza devedora: saldo = D - C
      saldoLiquido = s.debitos - s.creditos
      if (saldoLiquido <= 0.001) continue // sem saldo, ignora
      tipoPartida = 'C' // para zerar uma conta devedora, creditamos
      totalDispendios += saldoLiquido
    }

    partidasZeramento.push({
      contaId,
      tipo: tipoPartida,
      valor: Math.round(saldoLiquido * 100) / 100,
      historico: `Encerramento ${ano} — ${s.codigo}`,
    })
  }

  // 7. Calcular o Resultado: Superávit (positivo) ou Déficit (negativo)
  const resultado = totalIngressos - totalDispendios

  // 8. Buscar a conta transitória 2.3.3.01.001 (Resultado do Exercício Atual)
  const { data: contaResultado } = await sb
    .from('plano_contas')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('codigo', '2.3.3.01.001')
    .maybeSingle()

  if (!contaResultado) {
    return { error: 'Conta transitória 2.3.3.01.001 não encontrada. Reinicialize o Plano de Contas para incluir as novas contas de encerramento.' }
  }

  // 9. A contrapartida das contas zeradas vai para a conta transitória
  // Se totalIngressos > totalDispendios: superávit → conta transitória recebe crédito
  // Se totalDispendios > totalIngressos: déficit → conta transitória recebe débito
  if (Math.abs(resultado) > 0.001) {
    partidasZeramento.push({
      contaId: contaResultado.id,
      tipo: resultado > 0 ? 'C' : 'D',
      valor: Math.round(Math.abs(resultado) * 100) / 100,
      historico: `Resultado do Exercício ${ano} — ${resultado > 0 ? 'Superávit' : 'Déficit'}`,
    })
  }

  if (partidasZeramento.length < 2) {
    return { error: `Nenhum saldo a encerrar para o exercício de ${ano}.` }
  }

  // 10. Inserir o Lançamento 1: Zeramento das contas de resultado
  const { count: countLanc } = await sb
    .from('lancamentos_contabeis')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  const seq1 = ((countLanc || 0) + 1).toString().padStart(6, '0')
  const numero1 = `${ano}/${seq1}`

  const { data: lanc1, error: err1 } = await sb
    .from('lancamentos_contabeis')
    .insert({
      tenant_id: tenantId,
      numero_lancamento: numero1,
      data_lancamento: dataEncerramento,
      data_competencia: dataEncerramento,
      tipo: 'encerramento',
      historico: `ENCERRAMENTO DO EXERCÍCIO ${ano} — Apuração do Resultado (ITG 2002 R1)`,
      status: 'confirmado',
    })
    .select('id')
    .single()

  if (err1 || !lanc1) return { error: `Erro ao criar lançamento de zeramento: ${err1?.message}` }

  const partidasDb1 = partidasZeramento.map((p, i) => ({
    lancamento_id: lanc1.id,
    conta_id: p.contaId,
    tipo_partida: p.tipo,
    valor: p.valor,
    historico_partida: p.historico,
    ordem: i + 1,
  }))

  const { error: errP1 } = await sb.from('lancamentos_partidas').insert(partidasDb1)
  if (errP1) return { error: `Erro ao inserir partidas de zeramento: ${errP1.message}` }

  // 11. Inserir o Lançamento 2: Transferência da conta transitória para Acumulados
  const { data: contaAcumulados } = await sb
    .from('plano_contas')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('codigo', '2.3.2.01.001')
    .maybeSingle()

  if (contaAcumulados && Math.abs(resultado) > 0.001) {
    const seq2 = ((countLanc || 0) + 2).toString().padStart(6, '0')
    const numero2 = `${ano}/${seq2}`

    const { data: lanc2, error: err2 } = await sb
      .from('lancamentos_contabeis')
      .insert({
        tenant_id: tenantId,
        numero_lancamento: numero2,
        data_lancamento: dataEncerramento,
        data_competencia: dataEncerramento,
        tipo: 'encerramento',
        historico: `ENCERRAMENTO ${ano} — Transferência Resultado → Patrimônio Social (ITG 2002 R1)`,
        status: 'confirmado',
      })
      .select('id')
      .single()

    if (!err2 && lanc2) {
      // Transfere da conta transitória para a conta de acumulados
      await sb.from('lancamentos_partidas').insert([
        {
          lancamento_id: lanc2.id,
          conta_id: contaResultado.id,
          tipo_partida: resultado > 0 ? 'D' : 'C', // inverte a transitória
          valor: Math.round(Math.abs(resultado) * 100) / 100,
          historico_partida: `Resultado do Exercício ${ano} transferido ao Patrimônio Social`,
          ordem: 1,
        },
        {
          lancamento_id: lanc2.id,
          conta_id: contaAcumulados.id,
          tipo_partida: resultado > 0 ? 'C' : 'D', // acumula no patrimônio
          valor: Math.round(Math.abs(resultado) * 100) / 100,
          historico_partida: `Incorporação do ${resultado > 0 ? 'Superávit' : 'Déficit'} de ${ano} ao Patrimônio Social`,
          ordem: 2,
        },
      ])
    }
  }

  return {
    success: true,
    resultado,
    tipo: resultado >= 0 ? 'superavit' : 'deficit',
    totalIngressos,
    totalDispendios,
    contasZeradas: partidasZeramento.length - 1,
    ano,
  }
}
