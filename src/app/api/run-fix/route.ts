import { NextResponse } from 'next/server'
import { fixCalendarioMissingDaysAction } from '@/app/actions/financeiro_cleanup'

export async function GET() {
  try {
    const result = await fixCalendarioMissingDaysAction()
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
