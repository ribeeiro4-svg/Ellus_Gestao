import { NextResponse } from 'next/server'
import { fixAssociadosAbonoColumnsAction } from '@/app/actions/associados_fix'

export async function GET() {
  try {
    const result = await fixAssociadosAbonoColumnsAction()
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
