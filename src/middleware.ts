import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase env variables missing!')
    return NextResponse.next()
  }

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, opts: any) {
          request.cookies.set({ name, value, ...opts })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...opts })
        },
        remove(name: string, opts: any) {
          request.cookies.set({ name, value: '', ...opts })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...opts })
        },
      },
    }
  )

  const token = request.cookies.get('rbac_token')?.value
  let user: any = null
  let permissoes: Record<string, any> = {}

  if (token) {
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_please_change'
      const secret = new TextEncoder().encode(JWT_SECRET)
      // Importação dinâmica do jose para rodar no Edge
      const jose = await import('jose')
      const { payload } = await jose.jwtVerify(token, secret)
      user = payload.colaborador
      permissoes = (payload.permissoes as Record<string, any>) || {}
    } catch (err) {
      user = null
    }
  }

  // Redireciona para login se não autenticado
  if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redireciona para dashboard se já autenticado tentando acessar login
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // === PROTEÇÃO DE ROTAS (RBAC) ===
  if (user && user.perfil_id !== 1) { // 1 = Admin Master (tem acesso total)
    const path = request.nextUrl.pathname
    
    // Mapear rota raiz para o nome do módulo no banco de dados
    const routeToModuleMap: Record<string, string> = {
      '/associados': 'socios',
      '/financeiro': 'financeiro',
      '/fechamento': 'fechamento',
      '/planejamento': 'planejamento',
      '/bens-duraveis': 'bens_duraveis',
      '/cobranca': 'cobrancas',
      '/atendimentos': 'atendimentos',
      '/auditoria-financeira': 'auditoria', // Restrito: Tesoureiro e Admin apenas
      '/auditoria': 'auditoria',
      '/audit': 'auditoria', // Rota perigosa protegida
      '/estrategia': 'estrategia',
      '/gestao-tarefas': 'gestao_tarefas',
      '/recrutamento': 'recrutamento',
      '/fiscal': 'fiscal',
      '/contabil': 'contabil',
      '/importar': 'importar',
      // '/configuracoes' foi removido propositalmente para permitir acesso à aba 'Minha Conta'.
      // As abas internas de configurações são protegidas no frontend.
    }

    // Identificar o módulo base da URL
    const baseRoute = Object.keys(routeToModuleMap).find(route => path.startsWith(route))
    
    if (baseRoute) {
      const moduloNome = routeToModuleMap[baseRoute]
      const moduloPermissoes = permissoes[moduloNome]
      
      // Se não tiver permissão de ver, bloqueia acesso à página
      if (!moduloPermissoes || !moduloPermissoes.ver) {
        console.log(`[RBAC] Acesso negado para ${user.nome} na rota ${path}. Módulo: ${moduloNome}`)
        // Redireciona para a home se não puder ver
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth|api/fix-contas|api/check-contas|api/migrar-plano-contas|api/init-responsaveis).*)'],
}
