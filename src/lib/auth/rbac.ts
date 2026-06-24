import * as jose from 'jose'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_please_change'
const secret = new TextEncoder().encode(JWT_SECRET)

// --- Hashing ---
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// --- JWT ---
export async function signToken(payload: any): Promise<string> {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, secret)
    return payload as any
  } catch (error) {
    return null
  }
}

// --- Auditoria ---
export async function registrarAuditoria(colaboradorId: number, acao: string, modulo: string, ip?: string) {
  const sb = createAdminSupabase()
  await sb.from('auditoria_acessos').insert({
    colaborador_id: colaboradorId,
    acao,
    modulo,
    ip: ip || null
  })
}

// --- Middleware Wrapper ---
export type AuthenticatedRequest = NextRequest & { user?: any, colaboradorId?: number }

export function withPermission(modulo: string, acao: 'ver' | 'criar' | 'editar' | 'excluir') {
  return function wrapper(handler: (req: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse>) {
    return async (req: NextRequest, ...args: any[]) => {
      const token = cookies().get('rbac_token')?.value
      if (!token) {
        return NextResponse.json({ erro: 'Não autorizado. Token ausente.' }, { status: 401 })
      }

      try {
        const payload = await verifyToken(token)
        if (!payload || !payload.colaborador) {
          return NextResponse.json({ erro: 'Sessão expirada ou token inválido' }, { status: 401 })
        }

        const temAcesso = payload.permissoes[modulo]?.[acao]
        
        // Admin (perfil 1) sempre tem acesso total
        if (payload.colaborador.perfil_id !== 1 && !temAcesso) {
          return NextResponse.json({ erro: `Acesso negado. Sem permissão para ${acao} em ${modulo}.` }, { status: 403 })
        }

        // Injeta o user no request
        ;(req as AuthenticatedRequest).user = payload.colaborador
        ;(req as AuthenticatedRequest).colaboradorId = payload.colaborador.id

        // Registra a ação na auditoria
        const ip = req.headers.get('x-forwarded-for') || req.ip || undefined
        await registrarAuditoria(payload.colaborador.id, `Executou ação: ${acao}`, modulo, ip)

        return handler(req as AuthenticatedRequest, ...args)
      } catch (err) {
        return NextResponse.json({ erro: 'Token inválido ou expirado.' }, { status: 401 })
      }
    }
  }
}

// Requer apenas autenticação (qualquer colaborador logado)
export function requireAuth(handler: (req: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      const token = cookies().get('rbac_token')?.value
      if (!token) {
        return NextResponse.json({ erro: 'Não autorizado. Token ausente.' }, { status: 401 })
      }
      const payload = await verifyToken(token)
      if (!payload || !payload.colaborador) {
        return NextResponse.json({ erro: 'Sessão expirada ou token inválido' }, { status: 401 })
      }
      ;(req as AuthenticatedRequest).user = payload.colaborador
      ;(req as AuthenticatedRequest).colaboradorId = payload.colaborador.id
      return await handler(req as AuthenticatedRequest, ...args)
    } catch (err: any) {
      return NextResponse.json({ erro: err.message }, { status: 500 })
    }
  }
}

export function requireAdmin(handler: (req: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: any[]) => {
    try {
      const token = cookies().get('rbac_token')?.value
      if (!token) {
        return NextResponse.json({ erro: 'Não autorizado. Token ausente.' }, { status: 401 })
      }

      const payload = await verifyToken(token)
      if (!payload || !payload.colaborador) {
        return NextResponse.json({ erro: 'Sessão expirada ou token inválido' }, { status: 401 })
      }

      if (payload.colaborador.perfil_id !== 1) {
        return NextResponse.json({ erro: 'Acesso negado. Apenas administradores.' }, { status: 403 })
      }

      ;(req as AuthenticatedRequest).user = payload.colaborador
      ;(req as AuthenticatedRequest).colaboradorId = payload.colaborador.id

      return await handler(req as AuthenticatedRequest, ...args)
    } catch (err: any) {
      console.error('requireAdmin error:', err)
      return NextResponse.json({ erro: err.message, stack: err.stack }, { status: 500 })
    }
  }
}
