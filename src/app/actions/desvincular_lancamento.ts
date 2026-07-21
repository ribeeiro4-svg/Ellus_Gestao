'use server'

import { createClient } from '@supabase/supabase-js'

function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Server Action: Desvincular Lançamento
 *
 * Separa um lançamento que possui vínculo OFX + associada em dois registros
 * independentes, sem excluir dados e ignorando bloqueio de período fechado
 * (usa service role key para operar diretamente no banco).
 *
 * Passo 1 — Cria novo lançamento OFX puro (sem associada, com descrição original do extrato)
 * Passo 2 — Reverte o lançamento original para Em Aberto, sem vínculos OFX
 */
export async function desvincularLancamentoAction(
  lancamentoId: string,
  tenantId: string
): Promise<{ error: string | null; novoId?: string }> {
  const sb = createAdminSupabase()

  // Buscar o lançamento original com todos os campos necessários
  const { data: lanc, error: fetchErr } = await sb
    .from('lancamentos')
    .select('*')
    .eq('id', lancamentoId)
    .eq('tenant_id', tenantId)
    .single()

  if (fetchErr || !lanc) {
    return { error: fetchErr?.message || 'Lançamento não encontrado.' }
  }

  // Validações de segurança
  if (!lanc.banco_transacao_id) {
    return { error: 'Este lançamento não possui vínculo OFX (banco_transacao_id ausente).' }
  }
  if (!lanc.associado_id) {
    return { error: 'Este lançamento não está vinculado a nenhuma associada.' }
  }
  if (!lanc.conciliado) {
    return { error: 'Este lançamento não está marcado como conciliado.' }
  }

  const memoOriginal = (lanc.banco_original_memo || lanc.descricao || '').trim()

  // ── PASSO 1: Criar lançamento OFX puro (sem associada) ─────────────────────
  const novoLancamento: Record<string, any> = {
    tenant_id: tenantId,
    tipo: lanc.tipo,
    descricao: memoOriginal,
    banco_original_memo: memoOriginal,
    categoria: lanc.categoria,
    conta_id: lanc.conta_id,
    valor: lanc.valor,
    data: lanc.data,
    status: 'pago',
    conciliado: true,
    data_conciliacao: lanc.data_conciliacao,
    banco_transacao_id: lanc.banco_transacao_id,
    forma_pagamento: lanc.forma_pagamento,
    associado_id: null,
    fornecedor_id: null,
    diretor_id: null,
    competencia_mes: lanc.competencia_mes ?? null,
    competencia_ano: lanc.competencia_ano ?? null,
    conta_debito_id: lanc.conta_debito_id ?? null,
    conta_credito_id: lanc.conta_credito_id ?? null,
  }

  const { data: novo, error: insertErr } = await sb
    .from('lancamentos')
    .insert(novoLancamento)
    .select('id')
    .single()

  if (insertErr) {
    return { error: `Erro ao criar lançamento OFX: ${insertErr.message}` }
  }

  // ── PASSO 2: Reverter lançamento original da associada ──────────────────────
  const { error: updateErr } = await sb
    .from('lancamentos')
    .update({
      banco_transacao_id: null,
      cora_id: null,
      banco_original_memo: null,
      conciliado: false,
      data_conciliacao: null,
      status: 'aberto',
    })
    .eq('id', lancamentoId)
    .eq('tenant_id', tenantId)

  if (updateErr) {
    // Rollback: remover o novo lançamento criado no Passo 1
    await sb.from('lancamentos').delete().eq('id', novo.id)
    return { error: `Erro ao reverter lançamento original: ${updateErr.message}` }
  }

  return { error: null, novoId: novo.id }
}
