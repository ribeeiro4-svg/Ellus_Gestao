'use server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function createMissingAccountsAction(providedTenantId?: string) {
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  
  let tenantId = providedTenantId || '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  if (user) {
    const { data: userData } = await sb.from('usuarios').select('tenant_id').eq('id', user.id).single()
    if (userData?.tenant_id) tenantId = userData.tenant_id
  }

  const accountsToVerify = [
    // --- PASSIVO (2.1.1) ---
    { codigo: '2.1.1.06', descricao: 'Provisão para Férias a Pagar', nivel: 4, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true, pai: '2.1.1' },
    { codigo: '2.1.1.07', descricao: 'Provisão para 13º Salário a Pagar', nivel: 4, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true, pai: '2.1.1' },
    { codigo: '2.1.1.08', descricao: 'Bolsa de Estágio a Pagar', nivel: 4, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true, pai: '2.1.1' },
    { codigo: '2.1.1.09', descricao: 'Auxílio Alimentação — Estagiário a Pagar', nivel: 4, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true, pai: '2.1.1' },
    { codigo: '2.1.1.10', descricao: 'Auxílio Transporte — Estagiário a Pagar', nivel: 4, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true, pai: '2.1.1' },
    { codigo: '2.1.1.11', descricao: 'Pró-Labore a Pagar — Diretoria', nivel: 4, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true, pai: '2.1.1' },

    // --- DISPÊNDIOS ATIV. FIM (5.1.1) ---
    { codigo: '5.1.1.03', descricao: 'Bolsas de Estágio — Ativ. Fim', nivel: 4, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '5.1.1' },
    { codigo: '5.1.1.04', descricao: 'Auxílio Alimentação — Estagiário Ativ. Fim', nivel: 4, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '5.1.1' },
    { codigo: '5.1.1.05', descricao: 'Auxílio Transporte — Estagiário Ativ. Fim', nivel: 4, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '5.1.1' },

    // --- DISPÊNDIOS ADMIN (5.2.1) ---
    { codigo: '5.2.1.02', descricao: 'Pró-Labore da Diretoria', nivel: 4, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '5.2.1' },
    { codigo: '5.2.1.03', descricao: 'Encargos Sociais — Admin. (INSS patronal pro labore)', nivel: 4, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '5.2.1' },
    { codigo: '5.2.1.04', descricao: 'Bolsas de Estágio — Admin.', nivel: 4, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '5.2.1' },
    { codigo: '5.2.1.05', descricao: 'Auxílio Alimentação — Estagiário Admin.', nivel: 4, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '5.2.1' },
    { codigo: '5.2.1.06', descricao: 'Auxílio Transporte — Estagiário Admin.', nivel: 4, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '5.2.1' },

    // --- 3 USO E CONSUMO ---
    { codigo: '3', descricao: 'USO E CONSUMO', nivel: 1, tipo: 'sintetica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: false, pai: null },
    { codigo: '3.1', descricao: 'BENS DURÁVEIS', nivel: 2, tipo: 'sintetica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: false, pai: '3' },
    { codigo: '3.1.1', descricao: 'USO E CONSUMO - BENS DURÁVEIS', nivel: 3, tipo: 'sintetica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: false, pai: '3.1' },
    { codigo: '3.1.1.01', descricao: 'Aplicações em Bens Duráveis', nivel: 4, tipo: 'sintetica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: false, pai: '3.1.1' },
    { codigo: '3.1.1.01.001', descricao: 'Uso e Consumo - Bens Duráveis', nivel: 5, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '3.1.1.01' },
    
    // --- CONTAS DE AUDITORIA (5.2.2 / 5.2.3) ---
    { codigo: '5.2.2.01', descricao: 'Aluguel e Condomínio', nivel: 4, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '5.2.2' },
    { codigo: '5.2.2.12', descricao: 'Alimentação e Refeições', nivel: 4, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '5.2.2' },
    { codigo: '5.2.2.13', descricao: 'Combustíveis e Lubrificantes', nivel: 4, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '5.2.2' },
    { codigo: '5.2.2.14', descricao: 'Despesas Diversas', nivel: 4, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '5.2.2' },
    { codigo: '5.2.3.02', descricao: 'Tarifas Bancárias', nivel: 4, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '5.2.3' },
  ]

  const log: string[] = []
  let created = 0
  let skipped = 0

  for (const acc of accountsToVerify) {
    // 1. Verificar se a conta já existe
    const { data: existing } = await sb.from('plano_contas')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('codigo', acc.codigo)
      .single()

    if (existing) {
      log.push(`✅ EXISTENTE: ${acc.codigo} — ${acc.descricao}`)
      skipped++
      continue
    }

    // 2. Garantir que o pai existe
    const { data: pai } = await sb.from('plano_contas')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('codigo', acc.pai)
      .single()

    if (!pai && acc.pai !== null) {
      log.push(`⚠️ PAI AUSENTE: ${acc.pai} (Necessário criar o grupo primeiro)`)
      // Opcional: Criar o pai se for um grupo padrão (5.1.1, etc)
      continue
    }

    // 3. Criar a conta
    const { error, data: inserted } = await sb.from('plano_contas').insert({
      tenant_id: tenantId,
      codigo: acc.codigo,
      descricao: acc.descricao,
      nivel: acc.nivel,
      tipo: acc.tipo,
      natureza: acc.natureza,
      classificacao: acc.classificacao,
      aceita_lancamentos: acc.aceita_lancamentos,
      ativa: true,
      conta_pai_id: pai ? pai.id : null
    }).select('id').single()

    if (!error) {
      log.push(`🆕 CRIADA: ${acc.codigo} — ${acc.descricao}`)
      created++
    } else {
      log.push(`❌ ERRO: ${acc.codigo} — ${error.message}`)
    }
  }

  return { success: true, created, skipped, log }
}
