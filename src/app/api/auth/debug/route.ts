import { NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/auth/rbac'

export async function GET() {
  try {
    const sb = createAdminSupabase()
    const { data: colaboradores, error } = await sb.from('colaboradores').select('*')
    return NextResponse.json({ 
      colaboradores, 
      error,
      serviceKeyFirst5: process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 5) : 'MISSING',
      anonKeyFirst5: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 5) : 'MISSING'
    })
  } catch (err: any) {
    return NextResponse.json({ erro: err.message }, { status: 500 })
  }
}
