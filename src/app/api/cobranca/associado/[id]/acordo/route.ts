import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabase();
  const body = await request.json();
  const userRes = await supabase.auth.getUser();
  const userId = userRes.data.user?.id || '00000000-0000-0000-0000-000000000000';

  const valorParcelaStr = (body.valorTotal / body.numeroParcelas).toFixed(2);
  const valorParcela = parseFloat(valorParcelaStr);

  const { data: acordo, error: acordoError } = await supabase
    .from('cobranca_acordos')
    .insert({
      associado_id: params.id,
      valor_total: body.valorTotal,
      numero_parcelas: body.numeroParcelas,
      valor_parcela: valorParcela,
      data_primeira: body.dataPrimeira,
      observacoes: body.observacoes,
      criado_por: userId
    })
    .select()
    .single();

  if (acordoError) return NextResponse.json({ error: acordoError.message }, { status: 500 });

  const parcelas = [];
  const firstDate = new Date(body.dataPrimeira);
  for (let i = 0; i < body.numeroParcelas; i++) {
    const pDate = new Date(firstDate);
    pDate.setMonth(pDate.getMonth() + i);
    parcelas.push({
      acordo_id: acordo.id,
      numero: i + 1,
      vencimento: pDate.toISOString().split('T')[0],
      valor: valorParcela,
      status: 'pendente'
    });
  }

  await supabase.from('cobranca_acordos_parcelas').insert(parcelas);

  return NextResponse.json(acordo);
}
