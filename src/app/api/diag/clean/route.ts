
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sbAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Números das notas para limpar
  const numeros = ['17', '573168']

  const { data: deleted, error } = await sbAdmin
    .from('nfse_entradas')
    .delete()
    .in('numero_nfse', numeros)
    .select('id, numero_nfse')

  return NextResponse.json({ 
    success: !error,
    deleted_count: deleted?.length || 0,
    deleted_items: deleted,
    error 
  })
}
