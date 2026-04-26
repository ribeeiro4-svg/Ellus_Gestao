import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await sb.from('nfse_financeiro_vinculo').select('*').order('data_vinculo', { ascending: false }).limit(20)
  
  return NextResponse.json({ data, error })
}
