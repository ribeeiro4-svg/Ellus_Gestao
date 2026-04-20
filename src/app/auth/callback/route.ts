import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Se houver um parâmetro 'next', usamos como destino, senão vamos para /resumo
  const next = searchParams.get('next') ?? '/resumo'

  if (code) {
    const supabase = await createServerSupabase()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Se algo der errado, volta para o login com erro
  return NextResponse.redirect(`${origin}/login?error=auth-failure`)
}
