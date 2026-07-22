import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  // O cookies().delete() exclui o cookie no Next.js (apagando a HttpOnly flag na resposta)
  cookies().delete('rbac_token')
  return NextResponse.json({ success: true })
}
