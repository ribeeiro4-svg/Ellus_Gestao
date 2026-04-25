import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET() {
  const sb = await createServerSupabase()
  const tenantId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  
  const { data: contas, error } = await sb
    .from('plano_contas')
    .select('id, codigo, descricao')
    .eq('tenant_id', tenantId)
    .order('codigo', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message })
  }

  const counts: Record<string, any[]> = {}
  contas?.forEach(c => {
    if (!counts[c.descricao]) counts[c.descricao] = []
    counts[c.descricao].push(c)
  })

  const duplicates = Object.entries(counts)
    .filter(([_, arr]) => arr.length > 1)
    .map(([desc, arr]) => ({ descricao: desc, count: arr.length, examples: arr.slice(0, 3) }))

  return NextResponse.json({ total: contas?.length, duplicates })
}
