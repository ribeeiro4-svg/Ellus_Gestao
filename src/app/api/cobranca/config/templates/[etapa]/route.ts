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

export async function PUT(
  request: Request,
  { params }: { params: { etapa: string } }
) {
  const tenantId = await getTenantId();
  const admin = getAdminClient();
  const body = await request.json();
  const codigo = params.etapa;

  // Tenta por codigo + tenant
  const { data: byCode, error: errCode } = await admin
    .from('cobranca_templates')
    .update({ texto: body.texto, updated_at: new Date().toISOString() })
    .eq('codigo', codigo)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (!errCode && byCode) return NextResponse.json(byCode);

  // Fallback sem tenant (migração pendente)
  const { data, error } = await admin
    .from('cobranca_templates')
    .update({ texto: body.texto, updated_at: new Date().toISOString() })
    .eq('codigo', codigo)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
