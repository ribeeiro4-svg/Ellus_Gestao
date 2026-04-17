import { NextResponse } from 'next/server';
import { CoraService } from '@/lib/services/coraService';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Importa configurações de recorrência da Cora para o banco local
 * Vincula pelo documento (CPF/CNPJ)
 */
export async function GET() {
  try {
    const sb = await createServerSupabase();
    
    // 1. Identificar o Tenant
    const { data: tenants } = await sb.from('tenant_id_mapping').select('id').limit(1);
    const tenantId = tenants?.[0]?.id;
    if (!tenantId) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 400 });

    // 2. Buscar recorrências na Cora
    const response = await CoraService.listRecurrences();
    const recurrences = response?.data || [];

    if (!recurrences.length) {
      return NextResponse.json({ message: 'Nenhuma recorrência encontrada na Cora.' });
    }

    // 3. Processar e vincular
    const results = { total: recurrences.length, updated: 0, not_found: 0 };

    for (const rec of recurrences) {
      const doc = (rec.customer?.document || '').replace(/\D/g, '');
      if (!doc) continue;

      // Extrair o dia do próximo vencimento (ex: 2026-05-10 -> 10)
      const nextDate = rec.next_due_date;
      const day = nextDate ? parseInt(nextDate.split('-')[2]) : null;

      if (!day || ![10, 20].includes(day)) continue;

      // Buscar associado por CPF/CNPJ (removendo formatação)
      // Como o banco armazena com formatação às vezes, fazemos uma busca flexível
      const { data: assoc } = await sb
        .from('associados')
        .select('id')
        .eq('tenant_id', tenantId)
        .or(`cpf.eq.${doc},cpf.ilike.%${doc.substring(0,3)}%${doc.substring(3,6)}%`)
        .limit(1)
        .maybeSingle();

      if (assoc) {
        await sb.from('associados')
          .update({ vencimento_dia: day })
          .eq('id', assoc.id);
        results.updated++;
      } else {
        results.not_found++;
      }
    }

    return NextResponse.json({ success: true, summary: results });

  } catch (error: any) {
    console.error('[CoraRecurrenceSync Error]:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
