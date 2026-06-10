import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: { acordoId: string, parcelaId: string } }
) {
  const supabase = await createServerSupabase();
  const body = await request.json();

  const { data, error } = await supabase
    .from('cobranca_acordos_parcelas')
    .update({
      pago_valor: body.pagoValor,
      pago_em: body.pagoEm,
      status: 'pago'
    })
    .eq('id', params.parcelaId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
