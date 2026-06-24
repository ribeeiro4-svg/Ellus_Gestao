import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase/server';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getTenantAndUser(): Promise<{ tenantId: string | null; userId: string | null }> {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { tenantId: '971f92af-a72b-4bc4-a8e0-333d712ce6a7', userId: null };

    const admin = getAdminClient();
    const { data } = await admin
      .from('usuarios')
      .select('tenant_id')
      .eq('id', user.id)
      .maybeSingle();

    return {
      tenantId: data?.tenant_id ?? '971f92af-a72b-4bc4-a8e0-333d712ce6a7',
      userId: user.id,
    };
  } catch {
    return { tenantId: '971f92af-a72b-4bc4-a8e0-333d712ce6a7', userId: null };
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { tenantId, userId } = await getTenantAndUser();
  const admin = getAdminClient();
  const body = await request.json();

  const { data, error } = await admin
    .from('cobranca_acoes')
    .insert({
      associado_id: params.id,
      etapa: body.etapa,
      canal: body.canal,
      texto_enviado: body.textoEnviado,
      observacao: body.observacao,
      realizado_por: userId ?? '00000000-0000-0000-0000-000000000000',
      dias_atraso_momento: body.dias_atraso_momento,
      valor_momento: body.valor_momento,
      tenant_id: tenantId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
