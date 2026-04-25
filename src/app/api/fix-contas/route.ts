import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const sbAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const tenantId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  
  // 1. Fetch all accounts
  const { data: contas, error } = await sbAdmin
    .from('plano_contas')
    .select('id, codigo, descricao')
    .eq('tenant_id', tenantId)
    .order('codigo', { ascending: true })

  if (error) return NextResponse.json({ error: error.message })

  const counts: Record<string, any[]> = {}
  contas?.forEach(c => {
    // Normalize string to group similar ones just in case, but exact matches first
    const desc = c.descricao.trim().toUpperCase()
    if (!counts[desc]) counts[desc] = []
    counts[desc].push(c)
  })

  let mergedCount = 0
  let deletedCount = 0
  const results = []

  // 2. Process duplicates
  for (const [desc, arr] of Object.entries(counts)) {
    if (arr.length > 1) {
      // Keep the first one (lowest code)
      const primaryAccount = arr[0]
      const duplicateIds = arr.slice(1).map(c => c.id)

      // 3. Update lancamentos_partidas
      const { error: updErr1 } = await sbAdmin
        .from('lancamentos_partidas')
        .update({ conta_id: primaryAccount.id })
        .in('conta_id', duplicateIds)

      // 4. Update configuracoes_contabeis (just in case they are mapped)
      const { error: updErr2 } = await sbAdmin
        .from('configuracoes_contabeis')
        .update({ conta_id: primaryAccount.id })
        .in('conta_id', duplicateIds)

      // 5. Delete duplicates
      if (!updErr1 && !updErr2) {
        const { error: delErr } = await sbAdmin
          .from('plano_contas')
          .delete()
          .in('id', duplicateIds)

        if (!delErr) {
          deletedCount += duplicateIds.length
          mergedCount++
          results.push(`Merged ${duplicateIds.length} duplicates for ${desc} into ${primaryAccount.codigo}`)
        } else {
          results.push(`Error deleting ${desc}: ${delErr.message}`)
        }
      } else {
        results.push(`Error updating references for ${desc}: ${updErr1?.message || updErr2?.message}`)
      }
    }
  }

  return NextResponse.json({ 
    message: 'Cleanup finished', 
    mergedGroups: mergedCount,
    deletedAccounts: deletedCount,
    details: results
  })
}
