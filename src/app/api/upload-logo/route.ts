import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const tenantId = formData.get('tenantId') as string

    if (!file || !tenantId) {
      return NextResponse.json({ error: 'Arquivo ou Tenant ID não fornecido' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    // Usar o service role key para burlar o RLS do Storage
    const sbAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const fileExt = file.name.split('.').pop()
    const fileName = `${tenantId}-${Math.random().toString(36).substring(2)}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data, error } = await sbAdmin.storage
      .from('logos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (error) {
      console.error('Erro no upload via admin:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: { publicUrl } } = sbAdmin.storage
      .from('logos')
      .getPublicUrl(fileName)

    return NextResponse.json({ publicUrl })
  } catch (err: any) {
    console.error('Erro catastrófico no upload:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
