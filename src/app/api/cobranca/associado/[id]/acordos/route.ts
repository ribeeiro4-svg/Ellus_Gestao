import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase/server';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAuth(): Promise<{ tenantId: string; userId: string }> {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    const fallbackTenant = '971f92af-a72b-4bc4-a8e0-333d712ce6a7';
    if (!user) return { tenantId: fallbackTenant, userId: '00000000-0000-0000-0000-000000000000' };

    const admin = getAdminClient();
    const { data } = await admin.from('usuarios').select('tenant_id').eq('id', user.id).maybeSingle();
    return { tenantId: data?.tenant_id ?? fallbackTenant, userId: user.id };
  } catch {
    return { tenantId: '971f92af-a72b-4bc4-a8e0-333d712ce6a7', userId: '00000000-0000-0000-0000-000000000000' };
  }
}

// GET /api/cobranca/associado/[id]/acordos → lista acordos com parcelas
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { tenantId } = await getAuth();
  const admin = getAdminClient();

  const { data: acordos, error } = await admin
    .from('cobranca_acordos')
    .select('*, cobranca_acordos_parcelas(*)')
    .eq('associado_id', params.id)
    .eq('tenant_id', tenantId)
    .order('criado_em', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(acordos || []);
}

// POST /api/cobranca/associado/[id]/acordos → cria acordo + parcelas
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { tenantId, userId } = await getAuth();
  const admin = getAdminClient();
  const body = await request.json();

  const { valor_total, numero_parcelas, valor_parcela, data_primeira, observacoes } = body;

  // Cria o acordo
  const { data: acordo, error: errAcordo } = await admin
    .from('cobranca_acordos')
    .insert({
      associado_id: params.id,
      valor_total,
      numero_parcelas,
      valor_parcela,
      data_primeira,
      observacoes: observacoes || null,
      status: 'ativo',
      criado_por: userId,
      tenant_id: tenantId,
    })
    .select()
    .single();

  if (errAcordo) return NextResponse.json({ error: errAcordo.message }, { status: 500 });

  // Gera as parcelas automaticamente
  const parcelas = [];
  const base = new Date(data_primeira);
  for (let i = 0; i < numero_parcelas; i++) {
    const venc = new Date(base);
    venc.setMonth(venc.getMonth() + i);
    parcelas.push({
      acordo_id: acordo.id,
      numero: i + 1,
      vencimento: venc.toISOString().split('T')[0],
      valor: valor_parcela,
      status: 'pendente',
    });
  }

  const { error: errParcelas } = await admin.from('cobranca_acordos_parcelas').insert(parcelas);
  if (errParcelas) return NextResponse.json({ error: errParcelas.message }, { status: 500 });

  return NextResponse.json(acordo);
}
