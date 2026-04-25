import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const sb = createClient(supabaseUrl, supabaseServiceKey)

async function resequence() {
  const tenantId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  
  const { data: lancs, error } = await sb
    .from('lancamentos_contabeis')
    .select('id, numero_lancamento, data_lancamento, created_at')
    .eq('tenant_id', tenantId)
    .order('data_lancamento', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching:', error)
    return
  }

  console.log(`Total records to process: ${lancs.length}`)

  let seq = 1
  let updatedCount = 0

  for (const l of lancs) {
    const ano = l.data_lancamento ? l.data_lancamento.slice(0, 4) : new Date(l.created_at).getFullYear().toString()
    const strSeq = seq.toString().padStart(6, '0')
    const newNumero = `${ano}/${strSeq}`

    if (l.numero_lancamento !== newNumero) {
      const { error: updErr } = await sb
        .from('lancamentos_contabeis')
        .update({ numero_lancamento: newNumero })
        .eq('id', l.id)
        
      if (updErr) {
        console.error(`Error updating ${l.id}:`, updErr)
      } else {
        updatedCount++
      }
    }
    seq++
  }

  console.log(`Successfully updated ${updatedCount} records to sequential numbers.`)
}

resequence()
