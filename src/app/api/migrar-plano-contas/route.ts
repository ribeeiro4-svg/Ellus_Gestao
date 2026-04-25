import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const TENANT_ID = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
const SENHA = '19072425'

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── Contas a INATIVAR ─────────────────────────────────────────────────────
const INATIVAR = [
  { codigo: '4.2.2.01.110', motivo: '[INATIVA] Classificação incorreta — era DISPÊNDIO/D. Conta correta: 4.1.1.01 Mensalidades de Associados.' },
  { codigo: '3.1.1.01.100', motivo: '[INATIVA] Conta no grupo errado (Patrimônio Social). Era classificada como INGRESSO. Conta correta: 5.1.3.02.' },
  { codigo: '3.1.1.01.101', motivo: '[INATIVA] Conta no grupo errado (Patrimônio Social). Era classificada como INGRESSO. Conta correta: 5.2.1.05.' },
  { codigo: '3.1.1.01.134', motivo: '[INATIVA] Duplicata de 4.1.1.02 Taxa de Adesão. Conta no grupo errado (Patrimônio Social).' },
  { codigo: '2.1.3.04', motivo: '[INATIVA] Duplicata de 2.1.3.01.107 — Fornecedor: 42.011.517 DANIEL DE OLIVEIRA FRANCO.' },
  { codigo: '2.1.3.05', motivo: '[INATIVA] Duplicata de 2.1.3.01.100 — Fornecedor: 59.736.667 BRUNO RIBEIRO SANTOS DE MATOS.' },
  { codigo: '2.1.3.06', motivo: '[INATIVA] Duplicata de 2.1.3.01.101 — Fornecedor: OLIVEIRA SILVA & COMPANHIA LTDA.' },
  { codigo: '2.1.3.07', motivo: '[INATIVA] Duplicata de 2.1.3.01.104 — Fornecedor: 99 TECNOLOGIA LTDA.' },
  { codigo: '2.1.3.08', motivo: '[INATIVA] Duplicata de 2.1.3.01.105 — Fornecedor: CORA SCFI.' },
  { codigo: '2.1.3.09', motivo: '[INATIVA] Duplicata de 2.1.3.01.106 — Fornecedor: LPJ TELECOM E SERVICOS DIGITAIS LTDA.' },
  { codigo: '2.1.3.10', motivo: '[INATIVA] Duplicata de 2.1.3.01.108 — Fornecedor: BONDELE LIVRARIA E PAPELARIA LTDA.' },
  { codigo: '2.1.3.11', motivo: '[INATIVA] Duplicata de 2.1.3.01.102 — Fornecedor: CORA TECNOLOGIA LTDA.' },
  { codigo: '2.1.3.12', motivo: '[INATIVA] Duplicata de 2.1.3.01.103 — Fornecedor: CONTVALE CONTABILIDADE E ASSESSORIA LTDA.' },
  { codigo: '2.1.3.13', motivo: '[INATIVA] Duplicata de 2.1.3.01.113 — Fornecedor: EOC LIVRARIA E PAPELARIA LTDA.' },
]

// ─── Contas a CRIAR ────────────────────────────────────────────────────────
const CRIAR = [
  // 1.2.2 — Depreciações Acumuladas faltando
  { codigo: '1.2.2.08', descricao: '(-) Depreciação Acumulada — Móveis e Utensílios', nivel: 3, tipo: 'analitica', natureza: 'credora', classificacao: 'ativo', aceita_lancamentos: true },
  { codigo: '1.2.2.09', descricao: '(-) Depreciação Acumulada — Veículos', nivel: 3, tipo: 'analitica', natureza: 'credora', classificacao: 'ativo', aceita_lancamentos: true },
  { codigo: '1.2.2.10', descricao: '(-) Depreciação Acumulada — Softwares e Intangíveis', nivel: 3, tipo: 'analitica', natureza: 'credora', classificacao: 'ativo', aceita_lancamentos: true },
  // 2.1.1 — Provisões trabalhistas faltando
  { codigo: '2.1.1.06', descricao: 'Provisão para Férias', nivel: 3, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true },
  { codigo: '2.1.1.07', descricao: 'Provisão para 13º Salário', nivel: 3, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true },
  { codigo: '2.1.1.08', descricao: 'Bolsas de Estágio a Pagar', nivel: 3, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true },
  // 2.1.2 — CSLL retenção NFS-e
  { codigo: '2.1.2.05', descricao: 'CSLL a Recolher (Retenção NFS-e)', nivel: 3, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true },
  // 2.1.3.02 — Nova hierarquia prestadores NFS-e
  { codigo: '2.1.3.02', descricao: 'Prestadores de Serviços a Pagar (NFS-e)', nivel: 3, tipo: 'sintetica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: false },
  { codigo: '2.1.3.02.100', descricao: 'Prestador: 59.736.667 BRUNO RIBEIRO SANTOS DE MATOS', nivel: 4, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true },
  { codigo: '2.1.3.02.101', descricao: 'Prestador: 65.954.768 ANDERSON COSTA CORREA', nivel: 4, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true },
  { codigo: '2.1.3.02.102', descricao: 'Prestador: 42.011.517 DANIEL DE OLIVEIRA FRANCO', nivel: 4, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true },
  { codigo: '2.1.3.02.103', descricao: 'Prestador: CORA TECNOLOGIA LTDA', nivel: 4, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true },
  { codigo: '2.1.3.02.104', descricao: 'Prestador: 99 TECNOLOGIA LTDA — 18.033.552/0001-61', nivel: 4, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true },
  { codigo: '2.1.3.02.105', descricao: 'Prestador: LPJ TELECOM E SERVICOS DIGITAIS LTDA', nivel: 4, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true },
  { codigo: '2.1.3.02.106', descricao: 'Prestador: CONTVALE CONTABILIDADE E ASSESSORIA LTDA', nivel: 4, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true },
  { codigo: '2.1.3.02.107', descricao: 'Prestador: PAGAR.ME S.A. — ZAPSIGN', nivel: 4, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true },
  // 5.1.1 — Pessoal Ativ Fim
  { codigo: '5.1.1.03', descricao: 'Bolsas de Estágio — Ativ. Fim', nivel: 3, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true },
  // 5.1.3 — Serviços Ativ Fim
  { codigo: '5.1.3.02', descricao: 'Serviços Tomados — Ativ. Fim', nivel: 3, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true },
  // 5.2.1 — Pessoal Admin
  { codigo: '5.2.1.04', descricao: 'Bolsas de Estágio — Admin.', nivel: 3, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true },
  { codigo: '5.2.1.05', descricao: 'Verba de Representação — Diretoria', nivel: 3, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true },
  // 5.2.2 — Despesas Operacionais
  { codigo: '5.2.2.09', descricao: 'Serviços de TI e Assinaturas de Software', nivel: 3, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true },
  { codigo: '5.2.2.10', descricao: 'Serviços de Transporte e Mobilidade', nivel: 3, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true },
  { codigo: '5.2.2.11', descricao: 'Outros Serviços de Terceiros — Admin.', nivel: 3, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true },
]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (body.senha !== SENHA) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 })
    }

    const client = sb()
    const log: string[] = []
    const erros: string[] = []

    // ── 1. Buscar todas as contas existentes ──────────────────────────────
    const { data: existentes, error: fetchErr } = await client
      .from('plano_contas')
      .select('id, codigo, descricao, ativa')
      .eq('tenant_id', TENANT_ID)

    if (fetchErr) throw new Error('Erro ao buscar plano de contas: ' + fetchErr.message)
    const mapaExistentes = new Map<string, { id: string; ativa: boolean; descricao: string }>(
      (existentes || []).map(c => [c.codigo, { id: c.id, ativa: c.ativa, descricao: c.descricao }])
    )

    // ── 2. INATIVAR contas com erro ───────────────────────────────────────
    for (const item of INATIVAR) {
      const existente = mapaExistentes.get(item.codigo)
      if (!existente) {
        log.push(`⚠️ INATIVAR ${item.codigo}: conta não encontrada no banco (já pode ter sido removida).`)
        continue
      }
      if (!existente.ativa) {
        log.push(`ℹ️ INATIVAR ${item.codigo}: já estava inativa. Nenhuma alteração.`)
        continue
      }

      // Atualiza ativa=false e anexa motivo na descricao
      const novaDescricao = existente.descricao.startsWith('[INATIVA]')
        ? existente.descricao
        : `${existente.descricao} ${item.motivo}`

      const { error: updErr } = await client
        .from('plano_contas')
        .update({ ativa: false, descricao: novaDescricao })
        .eq('id', existente.id)
        .eq('tenant_id', TENANT_ID)

      if (updErr) {
        erros.push(`❌ Falha ao inativar ${item.codigo}: ${updErr.message}`)
      } else {
        log.push(`✅ INATIVADA: ${item.codigo} — ${existente.descricao}`)
      }
    }

    // ── 3. CRIAR contas novas ─────────────────────────────────────────────
    let criadas = 0
    let puladas = 0

    for (const conta of CRIAR) {
      if (mapaExistentes.has(conta.codigo)) {
        log.push(`ℹ️ CRIAR ${conta.codigo}: já existe. Pulando.`)
        puladas++
        continue
      }

      const { error: insErr } = await client.from('plano_contas').insert({
        tenant_id: TENANT_ID,
        codigo: conta.codigo,
        descricao: conta.descricao,
        nivel: conta.nivel,
        tipo: conta.tipo,
        natureza: conta.natureza,
        classificacao: conta.classificacao,
        aceita_lancamentos: conta.aceita_lancamentos,
        ativa: true,
      })

      if (insErr) {
        erros.push(`❌ Falha ao criar ${conta.codigo} (${conta.descricao}): ${insErr.message}`)
      } else {
        log.push(`✅ CRIADA: ${conta.codigo} — ${conta.descricao}`)
        criadas++
      }
    }

    // ── 4. Relatório de lançamentos em contas inativadas ─────────────────
    const codigosInativados = INATIVAR.map(i => i.codigo)
    const idsInativados = codigosInativados
      .map(c => mapaExistentes.get(c)?.id)
      .filter(Boolean) as string[]

    let lancamentosAfetados: any[] = []
    if (idsInativados.length > 0) {
      const { data: partidas } = await client
        .from('lancamentos_partidas')
        .select('id, conta_id, tipo_partida, valor, historico_partida')
        .in('conta_id', idsInativados)
        .limit(200)
      lancamentosAfetados = partidas || []
    }

    return NextResponse.json({
      success: true,
      resumo: {
        inativadas: log.filter(l => l.startsWith('✅ INATIVADA')).length,
        criadas,
        puladas,
        erros: erros.length,
        lancamentos_em_contas_inativadas: lancamentosAfetados.length,
      },
      log,
      erros,
      lancamentos_afetados: lancamentosAfetados,
      aviso: lancamentosAfetados.length > 0
        ? `⚠️ Existem ${lancamentosAfetados.length} partidas em contas agora inativadas. O contador deve reclassificá-las manualmente conforme o relatório de análise.`
        : '✅ Nenhuma partida histórica encontrada nas contas inativadas.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro inesperado' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    info: 'API de Migração do Plano de Contas — ITG 2002 (R1)',
    uso: 'POST com body: { "senha": "****" }',
    operacoes: {
      inativar: INATIVAR.length,
      criar: CRIAR.length,
    },
    aviso: 'Esta API NUNCA exclui contas. Apenas inativa e insere.',
  })
}
