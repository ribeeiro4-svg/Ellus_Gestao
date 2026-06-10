import { createClient } from '@supabase/supabase-js'

async function check() {
  const sbAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const res = await sbAdmin.rpc('exec_sql', { sql_query: "SELECT 1;" })
  console.log(res)
}

check()
