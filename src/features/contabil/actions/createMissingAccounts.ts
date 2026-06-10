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
    // --- PASSIVO (Permanecem no Grupo 2) ---
    { codigo: '2.1.1.06', descricao: 'Provisão para Férias a Pagar', nivel: 4, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true, pai: '2.1.1' },
    { codigo: '2.1.1.07', descricao: 'Provisão para 13º Salário a Pagar', nivel: 4, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true, pai: '2.1.1' },
    { codigo: '2.1.1.08', descricao: 'Bolsa de Estágio a Pagar', nivel: 4, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true, pai: '2.1.1' },
    { codigo: '2.1.1.09', descricao: 'Auxílio Alimentação — Estagiário a Pagar', nivel: 4, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true, pai: '2.1.1' },
    { codigo: '2.1.1.10', descricao: 'Auxílio Transporte — Estagiário a Pagar', nivel: 4, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true, pai: '2.1.1' },
    { codigo: '2.1.1.11', descricao: 'Pró-Labore a Pagar — Diretoria', nivel: 4, tipo: 'analitica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: true, pai: '2.1.1' },

    // --- CUSTOS E DESPESAS (Novo Grupo 4) ---
    { codigo: '4.2.1', descricao: 'Honorários de Diretores', nivel: 3, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '4.2' },
    { codigo: '4.2.2', descricao: 'Ordenados e Salários', nivel: 3, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '4.2' },
    { codigo: '4.2.10', descricao: 'Transporte de Empregados', nivel: 3, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '4.2' },
    { codigo: '4.2.11', descricao: 'Programa de Alimentação do Trabalhador', nivel: 3, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '4.2' },
    
    { codigo: '4.3.6', descricao: 'Aluguéis', nivel: 3, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '4.3' },
    { codigo: '4.3.8', descricao: 'Serviços de Terceiros', nivel: 3, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '4.3' },
    
    { codigo: '4.5.1', descricao: 'Luz', nivel: 3, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '4.5' },
    { codigo: '4.5.3', descricao: 'Telefone', nivel: 3, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '4.5' },
    { codigo: '4.5.4', descricao: 'Seguros', nivel: 3, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '4.5' },
    
    { codigo: '4.6.2', descricao: 'Juros Passivos', nivel: 3, tipo: 'analitica', natureza: 'devedora', classificacao: 'despesa', aceita_lancamentos: true, pai: '4.6' },

    // --- RECEITAS / INGRESSOS (Novo Grupo 3) ---
    { codigo: '3.1.1', descricao: 'Mensalidades de Associados', nivel: 3, tipo: 'analitica', natureza: 'credora', classificacao: 'ingresso', aceita_lancamentos: true, pai: '3.1' },
    { codigo: '3.2', descricao: 'Doações e subvenções', nivel: 2, tipo: 'analitica', natureza: 'credora', classificacao: 'ingresso', aceita_lancamentos: true, pai: '3' },
    { codigo: '3.3', descricao: 'Promoções', nivel: 2, tipo: 'analitica', natureza: 'credora', classificacao: 'ingresso', aceita_lancamentos: true, pai: '3' },
  ]

  const log: string[] = []
  let created = 0
  let skipped = 0

  for (const acc of accountsToVerify) {
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

    let paiId = null
    if (acc.pai) {
        const { data: pai } = await sb.from('plano_contas')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('codigo', acc.pai)
          .single()
        
        if (pai) {
            paiId = pai.id
        } else {
            log.push(`⚠️ PAI AUSENTE: ${acc.pai} para conta ${acc.codigo}`)
            continue
        }
    }

    const { error } = await sb.from('plano_contas').insert({
      tenant_id: tenantId,
      codigo: acc.codigo,
      descricao: acc.descricao,
      nivel: acc.nivel,
      tipo: acc.tipo,
      natureza: acc.natureza,
      classificacao: acc.classificacao,
      aceita_lancamentos: acc.aceita_lancamentos,
      ativa: true,
      conta_pai_id: paiId
    })

    if (!error) {
      log.push(`🆕 CRIADA: ${acc.codigo} — ${acc.descricao}`)
      created++
    } else {
      log.push(`❌ ERRO: ${acc.codigo} — ${error.message}`)
    }
  }

  return { success: true, created, skipped, log }
}
