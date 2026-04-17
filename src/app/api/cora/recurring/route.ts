import { NextResponse } from 'next/server';
import { CoraService } from '@/lib/services/coraService';
import { createServerSupabase } from '@/lib/supabase/server';
import { fmtData } from '@/lib/utils/formatters';

export const dynamic = 'force-dynamic';

/**
 * Rota de Cobrança Recorrente (R$ 50,00)
 * Acionada pelo Cron Job nos dias 10 e 20
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceDay = searchParams.get('day');
    
    // 1. Identificar o dia do vencimento (hoje ou forçado para teste)
    const todayNum = new Date().getDate();
    const billingDay = forceDay ? parseInt(forceDay) : todayNum;

    // Só processamos nos dias 10 e 20 (exceto se forçado)
    if (!forceDay && ![10, 20].includes(billingDay)) {
      return NextResponse.json({ message: `Hojé é dia ${todayNum}. Sem faturamentos programados para hoje.` });
    }

    const sb = await createServerSupabase();
    
    // 2. Identificar o Tenant (conta principal)
    const { data: tenants } = await sb.from('tenant_id_mapping').select('id').limit(1);
    const tenantId = tenants?.[0]?.id;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant não identificado.' }, { status: 400 });
    }

    console.log(`[CoraBilling] Iniciando faturamento para o dia ${billingDay}`);

    // 3. Buscar Associados Ativos com este dia de vencimento
    const { data: associates, error: assocError } = await sb
      .from('associados')
      .select('id, nome, cpf, email, mensalidade')
      .eq('tenant_id', tenantId)
      .eq('status', 'ativo')
      .eq('vencimento_dia', billingDay);

    if (assocError) throw assocError;
    if (!associates?.length) {
      return NextResponse.json({ message: `Nenhum associado ativo encontrado para o dia ${billingDay}.` });
    }

    // 4. Período de competência (Mês atual)
    const now = new Date();
    const monthLabel = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const description = `Mensalidade ACPROBEC - ${monthLabel}`;

    // 5. Processamento em Lote
    const results = { total: associates.length, success: 0, errors: 0, skipped: 0 };

    for (const assoc of associates) {
      try {
        // Verificar se já existe um lançamento para este associado neste mês e categoria
        const { data: existing } = await sb
          .from('financeiro')
          .select('id')
          .eq('associado_id', assoc.id)
          .eq('categoria', 'Mensalidades')
          .ilike('descricao', `%${monthLabel}%`)
          .maybeSingle();

        if (existing) {
          results.skipped++;
          continue;
        }

        const dueDate = new Date();
        dueDate.setDate(billingDay);
        // Se já passou do dia no cron, coloca para o mês que vem (segurança)
        if (dueDate < now && !forceDay) {
          dueDate.setMonth(dueDate.getMonth() + 1);
        }

        // Emitir na Cora
        const invoice = await CoraService.createInvoice({
          amount: 5000, // R$ 50,00 fixos conforme pedido
          name: assoc.nome,
          identity: assoc.cpf || '',
          dueDate: dueDate.toISOString().split('T')[0],
          description: description
        });

        // Registrar no Financeiro como Pendente
        await sb.from('financeiro').insert({
          tenant_id: tenantId,
          associado_id: assoc.id,
          tipo: 'receita',
          categoria: 'Mensalidades',
          descricao: description,
          valor: 50.00,
          status: 'aberto',
          forma_pagamento: 'Boleto',
          data: now.toISOString().split('T')[0],
          banco_transacao_id: invoice.id // Guardamos o ID da Cora para conciliação futura
        });

        results.success++;
      } catch (err: any) {
        console.error(`[CoraBilling Error] Falha ao processar associado ${assoc.nome}:`, err.message);
        results.errors++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      day: billingDay,
      summary: results
    });

  } catch (error: any) {
    console.error('[CoraBilling Critical Error]:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
