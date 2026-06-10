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

export async function DELETE(request: Request) {
  const tenantId = await getTenantId();
  const admin = getAdminClient();
  const { ids } = await request.json();

  if (!ids || !Array.isArray(ids)) {
    return NextResponse.json({ error: 'IDs inválidos' }, { status: 400 });
  }

  const { error } = await admin
    .from('cobranca_acoes')
    .delete()
    .in('id', ids)
    .eq('tenant_id', tenantId); // garante que só exclui registros do próprio tenant

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
