import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminSupabase } from '@/lib/auth/rbac'
import { verifyPassword, signToken, registrarAuditoria } from '@/lib/auth/rbac'

export async function POST(req: Request) {
  try {
    const { email, senha } = await req.json()
    if (!email || !senha) {
      return NextResponse.json({ erro: 'Email e senha são obrigatórios.' }, { status: 400 })
    }

    const sb = createAdminSupabase()

    // Buscar colaborador pelo email
    console.log('Login request for:', email)
    console.log('Has SERVICE ROLE KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    const { data: colaborador, error: colabError } = await sb
      .from('colaboradores')
      .select('id, nome, email, senha_hash, perfil_id, status')
      .eq('email', email)
      .single()

    console.log('Supabase Result:', { colaborador, colabError })

    if (colabError || !colaborador) {
      return NextResponse.json({ erro: 'Credenciais inválidas. ' + (colabError?.message || '') }, { status: 401 })
    }

    // Checar status
    if (colaborador.status === 'inativo') {
      return NextResponse.json({ erro: 'Acesso desativado. Contate o administrador.' }, { status: 403 })
    }

    // Verificar senha
    const isValid = await verifyPassword(senha, colaborador.senha_hash)
    if (!isValid) {
      return NextResponse.json({ erro: 'Credenciais inválidas.' }, { status: 401 })
    }

    // Buscar perfil e nome do perfil
    const { data: perfil } = await sb
      .from('perfis')
      .select('nome')
      .eq('id', colaborador.perfil_id)
      .single()

    // Buscar permissões
    const { data: permissoesArr } = await sb
      .from('perfil_permissoes')
      .select('modulo, pode_ver, pode_criar, pode_editar, pode_excluir')
      .eq('perfil_id', colaborador.perfil_id)

    // Formatar permissões como objeto: { modulo: { ver, criar, editar, excluir } }
    const permissoesObj: Record<string, any> = {}
    if (permissoesArr) {
      for (const p of permissoesArr) {
        permissoesObj[p.modulo] = {
          ver: p.pode_ver,
          criar: p.pode_criar,
          editar: p.pode_editar,
          excluir: p.pode_excluir
        }
      }
    }

    const payload = {
      colaborador: {
        id: colaborador.id,
        nome: colaborador.nome,
        perfil: perfil?.nome || 'Desconhecido',
        perfil_id: colaborador.perfil_id
      },
      permissoes: permissoesObj
    }

    const token = await signToken(payload)

    // Salvar o token em um cookie HttpOnly seguro
    cookies().set({
      name: 'rbac_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8 // 8 horas
    })

    // Log de auditoria
    const ip = req.headers.get('x-forwarded-for') || undefined
    await registrarAuditoria(colaborador.id, 'Login bem-sucedido', 'auth', ip)

    return NextResponse.json({
      token,
      colaborador: payload.colaborador,
      permissoes: payload.permissoes
    })
  } catch (err: any) {
    return NextResponse.json({ erro: 'Erro interno no servidor' }, { status: 500 })
  }
}
