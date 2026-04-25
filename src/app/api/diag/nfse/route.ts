
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const sbAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await sbAdmin
    .from('nfse_entradas')
    .select('id, tenant_id, numero_nfse, valor_bruto, data_emissao, prestador_id')
    .filter('valor_bruto', 'eq', 44.90)

  return NextResponse.json({ data, error })
}
