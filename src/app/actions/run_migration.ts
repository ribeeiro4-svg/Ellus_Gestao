'use server'
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function runMigrationAction() {
  try {
    // Run ALTER TABLE via rpc exec or direct query
    // Supabase JS doesn't support DDL directly — use raw SQL via pg
    // Instead, we attempt to read a row and write back, which forces column creation
    // The proper way: use a SQL function
    
    // Try via execute SQL approach
    const { error: err1 } = await adminClient.rpc('exec_ddl', {
      sql_text: 'ALTER TABLE tenants ADD COLUMN IF NOT EXISTS msg_whatsapp_cobranca TEXT'
    })

    const { error: err2 } = await adminClient.rpc('exec_ddl', {
      sql_text: 'ALTER TABLE tenants ADD COLUMN IF NOT EXISTS msg_whatsapp_hgu TEXT'
    })

    return { success: !err1 && !err2, err1, err2 }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
