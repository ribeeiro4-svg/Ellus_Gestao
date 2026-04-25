import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET() {
  const sb = await createServerSupabase()
  
  const tenantId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  
  const { data: lancs, error } = await sb
    .from('lancamentos_contabeis')
    .select('id, numero_lancamento, data_lancamento, created_at')
    .eq('tenant_id', tenantId)
    .order('data_lancamento', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message })
  }

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
        
      if (!updErr) {
        updatedCount++
      }
    }
    seq++
  }

  return NextResponse.json({ message: `Successfully updated ${updatedCount} records to sequential numbers. Total: ${lancs.length}` })
}
