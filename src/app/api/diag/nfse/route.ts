
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sbAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await sbAdmin
    .from('nfse_entradas')
    .select('id, tenant_id, numero_nfse, valor_bruto, data_emissao, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({ 
    last_notes: data, 
    search_44: (data || []).filter(n => Math.abs(Number(n.valor_bruto) - 44.90) < 0.1),
    error 
  })
}
