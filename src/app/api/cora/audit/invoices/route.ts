import { NextResponse } from 'next/server';
import { CoraService } from '@/lib/services/coraService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cpf = searchParams.get('cpf');

  if (!cpf) {
    return NextResponse.json({ error: 'CPF/CNPJ é obrigatório para auditoria' }, { status: 400 });
  }

  try {
    console.log(`[CoraAudit] Verificando boletos para: ${cpf}`);
    const invoices = await CoraService.getInvoicesByCustomer(cpf);
    
    // Filtramos boletos relevantes: OVERDUE (atrasado), OPEN (pendente), SCHEDULED (vincendo)
    const auditResult = invoices.map((inv: any) => ({
      id: inv.id,
      code: inv.code,
      status: inv.status, // OPEN, OVERDUE, PAID, CANCELLED
      amount: inv.totalAmount / 100,
      dueDate: inv.dueDate,
      customerName: inv.customer?.name,
      pdfUrl: `/api/cora/invoices/${inv.id}/pdf`
    }));

    return NextResponse.json({ 
      success: true, 
      invoices: auditResult 
    });

  } catch (error: any) {
    console.error('[CoraAudit Error]:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      diag: 'Certifique-se que CORA_CERT e CORA_KEY estão configurados no Vercel.'
    }, { status: 500 });
  }
}
