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

export async function GET() {
  const tenantId = await getTenantId();
  const admin = getAdminClient();

  const { data, error } = await admin
    .from('cobranca_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('dias_min', { ascending: true });

  if (error) {
    // Fallback: retorna templates sem tenant_id (migração ainda pendente)
    const { data: fallback } = await admin
      .from('cobranca_templates')
      .select('*')
      .order('dias_min', { ascending: true });
    return NextResponse.json(fallback || []);
  }

  // Se não há templates para este tenant, busca os genéricos
  if (!data || data.length === 0) {
    const { data: fallback } = await admin
      .from('cobranca_templates')
      .select('*')
      .order('dias_min', { ascending: true });
    return NextResponse.json(fallback || []);
  }

  return NextResponse.json(data);
}
