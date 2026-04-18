import { NextResponse } from 'next/server';
import { CoraService } from '@/lib/services/coraService';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
    console.log(`[CoraPDF] Buscando PDF para invoice: ${invoiceId}`);
    
    // Na Cora v2, o endpoint de PDF costuma retornar um JSON com a URL ou o arquivo direto
    // Vamos usar o método que configuramos no CoraService
    const result = await CoraService.getInvoicePdf(invoiceId);

    if (result.url) {
      return NextResponse.redirect(result.url);
    }

    return NextResponse.json({ error: 'URL do PDF não encontrada' }, { status: 404 });

  } catch (error: any) {
    console.error('[CoraPDF Error]:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
