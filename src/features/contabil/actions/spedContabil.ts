'use server'
import { createServerSupabase } from '@/lib/supabase/server'

// ─── Helpers ────────────────────────────────────────────────────────────────

const pad = (v: string | number, len: number) => String(v).padStart(len, '0')
const dateToSped = (d: string) => {
  // converte YYYY-MM-DD → DDMMYYYY
  if (!d || d.length < 10) return ''
  return d.slice(8, 10) + d.slice(5, 7) + d.slice(0, 4)
}
const numSped = (v: number) => v.toFixed(2).replace('.', ',')

// ─── Geração do arquivo ECD SPED Contábil ───────────────────────────────────
// Baseado na IN RFB nº 2.003/2021 e layout SPED Contábil v11

export async function gerarECDAction(ano: number) {
  const sb = await createServerSupabase()

  // 1. Identificar o tenant
  const { data: sample } = await sb
    .from('lancamentos_contabeis')
    .select('tenant_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sample?.tenant_id) {
    return { error: 'Nenhum lançamento encontrado. Sincronize os lançamentos antes de gerar o ECD.' }
  }
  const tenantId = sample.tenant_id

  // 2. Buscar dados do tenant (configurações da associação)
  const { data: tenant } = await sb
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .maybeSingle()

  const nomeEmpresa = tenant?.nome || 'ASSOCIACAO ACPROBEC'
  const cnpj = (tenant?.cnpj || '00000000000000').replace(/\D/g, '')
  const dataInicio = `${ano}-01-01`
  const dataFim = `${ano}-12-31`

  // 3. Buscar Plano de Contas
  const { data: contas } = await sb
    .from('plano_contas')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('codigo')

  if (!contas || contas.length === 0) {
    return { error: 'Plano de Contas não inicializado.' }
  }

  // 4. Buscar todos os lançamentos do ano com partidas
  const { data: lancamentos } = await sb
    .from('lancamentos_contabeis')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'confirmado')
    .gte('data_lancamento', dataInicio)
    .lte('data_lancamento', dataFim)
    .order('data_lancamento')

  const { data: todasPartidas } = await sb
    .from('lancamentos_partidas')
    .select('*, lancamento:lancamento_id(tenant_id, status, data_competencia)')
    .eq('lancamento.tenant_id', tenantId)
    .eq('lancamento.status', 'confirmado')
    .gte('lancamento.data_competencia', dataInicio)
    .lte('lancamento.data_competencia', dataFim)

  // 5. Calcular saldos de abertura (zerados para o primeiro exercício)
  const saldoAbertura: Record<string, number> = {}
  contas.forEach(c => { saldoAbertura[c.id] = 0 })

  // 6. Calcular saldos por conta para o período
  const saldosFechamento: Record<string, { debitos: number; creditos: number }> = {}
  ;(todasPartidas ?? []).forEach((p: any) => {
    if (!saldosFechamento[p.conta_id]) saldosFechamento[p.conta_id] = { debitos: 0, creditos: 0 }
    if (p.tipo_partida === 'D') saldosFechamento[p.conta_id].debitos += Number(p.valor)
    else saldosFechamento[p.conta_id].creditos += Number(p.valor)
  })

  const linhas: string[] = []
  let totalLinhas = 0

  const addLinha = (linha: string) => {
    linhas.push('|' + linha + '|')
    totalLinhas++
  }

  // ─── BLOCO 0 ───────────────────────────────────────────────────────────────
  // 0000 — Abertura
  addLinha(`0000|LECD|${cnpj}|${nomeEmpresa.toUpperCase()}|||01|${dateToSped(dataInicio)}|${dateToSped(dataFim)}|||||S|||N`)
  addLinha(`0001|1`)

  // 0007 — Informações da empresa
  addLinha(`0007|${cnpj}|${nomeEmpresa.toUpperCase()}|BR`)

  // 0150 — Tabela de cadastro de participantes (empresa própria)
  addLinha(`0150|001|${cnpj}|${nomeEmpresa.toUpperCase()}||`)

  // 0990 — Fechamento do Bloco 0
  addLinha(`0990|${linhas.length + 1}`)

  // ─── BLOCO I ───────────────────────────────────────────────────────────────
  const inicioI = linhas.length

  addLinha(`I001|1`)

  // I010 — Abertura das escriturações
  addLinha(`I010|G|${dateToSped(dataInicio)}|${dateToSped(dataFim)}|01|${cnpj}||`)

  // I020 — Identificação dos signatários (simplificado)
  addLinha(`I020|1|Contador Responsável||CRC||`)

  // I050 — Plano de Contas (uma linha por conta)
  for (const conta of contas) {
    const natureza = conta.natureza === 'devedora' ? 'D' : 'C'
    const tipo = conta.tipo === 'analitica' ? 'A' : 'S'
    // Classificação contábil SPED: AC=Ativo Circulante, PC=Passivo Circulante, etc.
    const classif = mapearClassificacaoSPED(conta.codigo)
    addLinha(`I050|${dateToSped(dataInicio)}|${dateToSped(dataFim)}|${conta.codigo}|${tipo}|${natureza}|${conta.descricao.toUpperCase()}|${classif}|`)
  }

  // I051 — Relacionamento das Contas (pai → filho)
  for (const conta of contas) {
    const codigoPai = obterCodigoPai(conta.codigo)
    if (codigoPai) {
      addLinha(`I051|${dateToSped(dataInicio)}|${conta.codigo}|${codigoPai}`)
    }
  }

  // I100 — Abertura dos saldos (saldo inicial de cada conta analítica)
  const contasAnaliticas = contas.filter((c: any) => c.tipo === 'analitica')
  for (const conta of contasAnaliticas) {
    const saldo = saldoAbertura[conta.id] ?? 0
    const ind = conta.natureza === 'devedora' ? 'D' : 'C'
    addLinha(`I100|${conta.codigo}|${dateToSped(dataInicio)}|${numSped(Math.abs(saldo))}|${ind}`)
  }

  // I150 — Saldos periódicos (saldo do período para cada conta analítica)
  for (const conta of contasAnaliticas) {
    const s = saldosFechamento[conta.id]
    if (!s || (s.debitos === 0 && s.creditos === 0)) continue
    const saldoLiq = conta.natureza === 'devedora'
      ? s.debitos - s.creditos
      : s.creditos - s.debitos
    const ind = saldoLiq >= 0 ? (conta.natureza === 'devedora' ? 'D' : 'C') : (conta.natureza === 'devedora' ? 'C' : 'D')
    addLinha(`I150|${conta.codigo}|${dateToSped(dataFim)}|${numSped(Math.abs(saldoLiq))}|${ind}`)
  }

  // I200 + I250 — Lançamentos do Livro Diário
  let seq = 1
  for (const lanc of (lancamentos ?? [])) {
    const numLanc = pad(seq++, 6)
    const dataLanc = dateToSped(lanc.data_lancamento)
    addLinha(`I200|${numLanc}|${dataLanc}|${dataLanc}||${lanc.historico?.toUpperCase() || ''}|${lanc.documento_numero || ''}||`)

    // Buscar partidas deste lançamento
    const partidasLanc = (todasPartidas ?? []).filter((p: any) => p.lancamento_id === lanc.id)
    let ordemPartida = 1
    for (const p of partidasLanc) {
      const conta = contas.find((c: any) => c.id === p.conta_id)
      if (!conta) continue
      addLinha(`I250|${numLanc}|${ordemPartida++}|${conta.codigo}|${p.tipo_partida}|${numSped(Number(p.valor))}|${p.historico_partida?.toUpperCase() || ''}|`)
    }
  }

  // I990 — Fechamento do Bloco I
  addLinha(`I990|${linhas.length - inicioI + 1}`)

  // ─── BLOCO J ───────────────────────────────────────────────────────────────
  const inicioJ = linhas.length

  addLinha(`J001|1`)

  // J005 — Identificação das demonstrações
  addLinha(`J005|${dateToSped(dataInicio)}|${dateToSped(dataFim)}|01|${cnpj}|BRL|`)

  // J100 — Balanço Patrimonial (contas do Ativo, Passivo e Patrimônio Social)
  const contasBP = contas.filter((c: any) =>
    ['ativo', 'passivo', 'patrimonio_social'].includes(c.classificacao) && c.tipo === 'analitica'
  )
  for (const conta of contasBP) {
    const s = saldosFechamento[conta.id]
    const saldoLiq = s
      ? (conta.natureza === 'devedora' ? s.debitos - s.creditos : s.creditos - s.debitos)
      : 0
    const ind = saldoLiq >= 0 ? conta.natureza[0].toUpperCase() : (conta.natureza === 'devedora' ? 'C' : 'D')
    addLinha(`J100|${conta.codigo}|${numSped(0)}|D|${numSped(Math.abs(saldoLiq))}|${ind}`)
  }

  // J150 — DSD (Demonstração do Superávit ou Déficit)
  const contasDSD = contas.filter((c: any) =>
    ['ingresso', 'despesa'].includes(c.classificacao) && c.tipo === 'analitica'
  )
  for (const conta of contasDSD) {
    const s = saldosFechamento[conta.id]
    const saldoLiq = s
      ? (conta.natureza === 'devedora' ? s.debitos - s.creditos : s.creditos - s.debitos)
      : 0
    if (Math.abs(saldoLiq) < 0.001) continue
    const ind = saldoLiq >= 0 ? conta.natureza[0].toUpperCase() : (conta.natureza === 'devedora' ? 'C' : 'D')
    addLinha(`J150|${conta.codigo}|${numSped(0)}|D|${numSped(Math.abs(saldoLiq))}|${ind}`)
  }

  // J990 — Fechamento do Bloco J
  addLinha(`J990|${linhas.length - inicioJ + 1}`)

  // ─── BLOCO 9 ───────────────────────────────────────────────────────────────
  addLinha(`9001|1`)
  addLinha(`9900|0000|${linhas.filter(l => l.startsWith('|0')).length}`)
  addLinha(`9900|I001|${linhas.filter(l => l.startsWith('|I')).length}`)
  addLinha(`9900|J001|${linhas.filter(l => l.startsWith('|J')).length}`)
  addLinha(`9900|9001|4`)
  addLinha(`9990|${4}`)
  addLinha(`9999|${totalLinhas}`)

  const conteudo = linhas.join('\r\n')

  return {
    success: true,
    conteudo,
    nomeArquivo: `ECD_SPED_${cnpj}_${ano}.txt`,
    totalLinhas,
    totalLancamentos: lancamentos?.length ?? 0,
    totalContas: contas.length,
  }
}

// ─── Helpers de mapeamento ───────────────────────────────────────────────────

function mapearClassificacaoSPED(codigo: string): string {
  if (codigo.startsWith('1.1')) return 'AC'
  if (codigo.startsWith('1.2')) return 'ANC'
  if (codigo.startsWith('2.1')) return 'PC'
  if (codigo.startsWith('2.2')) return 'PNC'
  if (codigo.startsWith('2.3')) return 'PL'
  if (codigo.startsWith('3')) return 'RL'
  if (codigo.startsWith('4')) return 'CD'
  return 'OT'
}

function obterCodigoPai(codigo: string): string | null {
  const partes = codigo.split('.')
  if (partes.length <= 1) return null
  return partes.slice(0, -1).join('.')
}
