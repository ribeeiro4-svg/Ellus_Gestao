import { NextResponse } from 'next/server';
import { CoraService } from '@/lib/services/coraService';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const sb = await createServerSupabase();
    
    // 1. Identificar o Tenant e buscar suas credenciais Cora
    const { data: mapping } = await sb.from('tenant_id_mapping').select('id').limit(1).single();
    const tenantId = mapping?.id || '971f92af-a72b-4bc4-a8e0-333d712ce6a7';

    const { data: tenant } = await sb.from('tenants')
      .select('cora_id, cora_cert, cora_key')
      .eq('id', tenantId)
      .single();

    const coraConfig = {
      clientId: tenant?.cora_id,
      cert: tenant?.cora_cert,
      key: tenant?.cora_key
    };

    // 2. Definir janela de tempo: Hoje e Ontem para evitar lacunas
    const start = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = new Date().toISOString().split('T')[0];

    console.log(`[CoraSync] Buscando extrato para ${tenantId}`);
    
    // 3. Buscar na API com as credenciais dinâmicas do banco
    const transactions = await CoraService.getStatement(start, end, coraConfig);

    if (!transactions.length) {
      return NextResponse.json({ message: 'Nenhuma transação nova na Cora.' });
    }

    // 4. Salvar na Vila de Espera (cora_staged)
    const rows = transactions.map(t => ({
      tenant_id: tenantId,
      cora_id: t.id,
      data: t.transactedAt,
      descricao: t.description,
      valor: t.amount / 100, // Cora envia em centavos, convertemos para Reais
      tipo: t.type,
      documento: t.counterParty?.identity || null,
      status: 'pendente'
    }));

    // Inserção com "onConflict" para ignorar o que já foi importado anteriormente
    const { error, count } = await sb.from('cora_staged').upsert(rows, { 
      onConflict: 'cora_id' 
    });

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      processed: transactions.length,
      new_items: count 
    });

  } catch (error: any) {
    console.error('[CoraSync Error]:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
