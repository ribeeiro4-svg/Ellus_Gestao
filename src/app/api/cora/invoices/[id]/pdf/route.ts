import { NextResponse } from 'next/server';
import { CoraService } from '@/lib/services/coraService';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    console.log(`[CoraPDF] Buscando PDF para invoice: ${invoiceId}`);
    
    const sb = await createServerSupabase();
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

    // 2. Buscar PDF na Cora com configuração dinâmica
    const result = await CoraService.getInvoicePdf(invoiceId, coraConfig);

    if (result.url) {
      return NextResponse.redirect(result.url);
    }

    return NextResponse.json({ error: 'URL do PDF não encontrada' }, { status: 404 });

  } catch (error: any) {
    console.error('[CoraPDF Error]:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
