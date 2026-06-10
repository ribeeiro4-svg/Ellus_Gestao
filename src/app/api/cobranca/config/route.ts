import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase/server';

// Usa service role para bypassar RLS e operar com tenant_id explícito
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getTenantId(): Promise<string | null> {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const admin = getAdminClient();
    const { data } = await admin
      .from('usuarios')
      .select('tenant_id')
      .eq('id', user.id)
      .maybeSingle();

    return data?.tenant_id ?? '971f92af-a72b-4bc4-a8e0-333d712ce6a7';
  } catch {
    return '971f92af-a72b-4bc4-a8e0-333d712ce6a7';
  }
}

export async function GET() {
  const tenantId = await getTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const admin = getAdminClient();
  const { data, error } = await admin
    .from('cobranca_configuracoes')
    .select('*')
    .eq('tenant_id', tenantId)
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || {});
}

export async function PUT(request: Request) {
  const tenantId = await getTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const body = await request.json();
  const admin = getAdminClient();

  const { data: existing } = await admin
    .from('cobranca_configuracoes')
    .select('id')
    .eq('tenant_id', tenantId)
    .limit(1)
    .maybeSingle();

  const payload = {
    tenant_id: tenantId,
    nome_associacao: body.nome_associacao,
    nome_tesoureiro: body.nome_tesoureiro,
    contato_tesouraria: body.contato_tesouraria,
    cidade: body.cidade,
    multa_moratoria_perc: body.multa_moratoria_perc,
    juros_mora_mensal_perc: body.juros_mora_mensal_perc,
    dias_para_suspensao: body.dias_para_suspensao,
    updated_at: new Date().toISOString(),
  };

  let result;
  if (existing?.id) {
    result = await admin
      .from('cobranca_configuracoes')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
  } else {
    result = await admin
      .from('cobranca_configuracoes')
      .insert(payload)
      .select()
      .single();
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json(result.data);
}
