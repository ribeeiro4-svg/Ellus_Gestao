import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Rota de manutenção — roda a migration de colunas WhatsApp na tabela tenants
// Chamar: GET /api/migrate-whatsapp-templates
export async function GET() {
  try {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Add columns via INSERT trick — use raw SQL through postgres rest
    // Supabase JS does not support DDL. We use the pg_catalog approach via a workaround:
    // Insert + update to force-check column existence.
    // Best approach: run ALTER via a stored procedure
    
    // Attempt 1: use exec function if available
    const results: any[] = []
    
    const { data: d1, error: e1 } = await adminClient.rpc('exec_sql' as any, {
      sql: 'ALTER TABLE tenants ADD COLUMN IF NOT EXISTS msg_whatsapp_cobranca TEXT'
    })
    results.push({ col: 'msg_whatsapp_cobranca', data: d1, error: e1?.message })
    
    const { data: d2, error: e2 } = await adminClient.rpc('exec_sql' as any, {
      sql: 'ALTER TABLE tenants ADD COLUMN IF NOT EXISTS msg_whatsapp_hgu TEXT'
    })
    results.push({ col: 'msg_whatsapp_hgu', data: d2, error: e2?.message })

    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
