import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const sb = createClient(supabaseUrl, supabaseServiceKey)

async function checkDuplicates() {
  const tenantId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7' // using the hardcoded one we know exists, or we can fetch the user's
  
  // get all lancamentos for this tenant
  const { data: lancs, error } = await sb
    .from('lancamentos_contabeis')
    .select('id, numero_lancamento, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching:', error)
    return
  }

  console.log(`Total records: ${lancs.length}`)

  const counts: Record<string, number> = {}
  let duplicates = 0

  for (const l of lancs) {
    if (!counts[l.numero_lancamento]) {
      counts[l.numero_lancamento] = 1
    } else {
      counts[l.numero_lancamento]++
      duplicates++
    }
  }

  console.log(`Duplicate numbers found: ${duplicates}`)
  
  // Show a few examples of duplicates
  const duplicateExamples = Object.entries(counts).filter(([_, c]) => c > 1).slice(0, 5)
  console.log('Examples of duplicate numbers:', duplicateExamples)
}

checkDuplicates()
