import { initAtendimentosDbAction } from '@/app/actions/atendimentosDbInit'
import { NextResponse } from 'next/server'

export async function GET() {
  const res = await initAtendimentosDbAction()
  return NextResponse.json(res)
}
