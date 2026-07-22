import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase/server';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getTenantId(): Promise<string> {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return '971f92af-a72b-4bc4-a8e0-333d712ce6a7';
    const admin = getAdminClient();
    const { data } = await admin.from('usuarios').select('tenant_id').eq('id', user.id).maybeSingle();
    return data?.tenant_id ?? '971f92af-a72b-4bc4-a8e0-333d712ce6a7';
  } catch {
    return '971f92af-a72b-4bc4-a8e0-333d712ce6a7';
  }
}

// PATCH /api/cobranca/acordo/[acordoId] → atualiza status do acordo
// PATCH /api/cobranca/acordo/[acordoId]?parcela=id → marca parcela como paga
export async function PATCH(
  request: Request,
  { params }: { params: { acordoId: string } }
) {
  const admin = getAdminClient();
  const body = await request.json();
  const url = new URL(request.url);
  const parcelaId = url.searchParams.get('parcela');

  if (parcelaId) {
    // Marca parcela como paga
    const { data, error } = await admin
      .from('cobranca_acordos_parcelas')
      .update({ status: 'pago', pago_em: new Date().toISOString().split('T')[0], pago_valor: body.pago_valor })
      .eq('id', parcelaId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Verifica se todas as parcelas foram pagas para quitar o acordo
    const { data: todasParcelas } = await admin
      .from('cobranca_acordos_parcelas')
      .select('status')
      .eq('acordo_id', params.acordoId);

    const todasPagas = todasParcelas?.every(p => p.status === 'pago');
    if (todasPagas) {
      await admin.from('cobranca_acordos').update({ status: 'quitado' }).eq('id', params.acordoId);
    }

    return NextResponse.json(data);
  }

  // Atualiza status do acordo (ex: cancelar)
  const { data, error } = await admin
    .from('cobranca_acordos')
    .update({ status: body.status })
    .eq('id', params.acordoId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: { acordoId: string } }
) {
  const admin = getAdminClient();
  const { error } = await admin.from('cobranca_acordos').delete().eq('id', params.acordoId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
