import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { searchParams } = new URL(request.url)
  const val = searchParams.get('val') || '740.77'

  // find lancamento with this value
  const { data: lancs } = await sb.from('lancamentos').select('*').eq('valor', val).order('created_at', { ascending: false }).limit(5)
  if (!lancs || !lancs.length) return NextResponse.json({ error: 'lancamento not found' })

  const lanc = lancs[0]

  const { data: links } = await sb.from('nfse_financeiro_vinculo').select('*').eq('transacao_id', lanc.id)
  
  const { data: testJoin } = await sb.from('lancamentos').select('*, nfse_vinculo:nfse_financeiro_vinculo(*)').eq('id', lanc.id)

  return NextResponse.json({ 
    lancamento: lanc,
    linksDiretos: links,
    linksJoin: testJoin?.[0]?.nfse_vinculo
  })
}
