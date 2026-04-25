import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const sbAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const tenantId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  
  const { data, error } = await sbAdmin
    .from('nfse_entradas')
    .select('*')
    .eq('tenant_id', tenantId)

  if (error) {
    return NextResponse.json({ error: error.message })
  }

  return NextResponse.json({ count: data?.length, data })
}
