'use server'

import { createClient } from '@supabase/supabase-js'

export async function uploadTermoSuspensaoAction(formData: FormData) {
  const tenantId = formData.get('tenantId') as string
  const associadoId = formData.get('associadoId') as string
  const file = formData.get('file') as File

  if (!associadoId || !file || !tenantId) {
    return { error: 'Dados inválidos para upload do termo de suspensão.' }
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const ext = file.name.split('.').pop()
    const fileName = `${tenantId}/${associadoId}/suspensao_${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('documentos_associados')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      console.error('Erro no upload via Server Action:', uploadError)
      return { error: `Falha no upload do arquivo: ${uploadError.message}` }
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('documentos_associados')
      .createSignedUrl(fileName, 315360000) // 10 anos em segundos

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('Erro ao gerar URL assinada:', signedUrlError)
      return { error: 'Erro ao gerar URL do documento.' }
    }

    return { success: true, signedUrl: signedUrlData.signedUrl }
  } catch (error: any) {
    console.error('Erro inesperado no upload:', error)
    return { error: 'Erro interno ao processar o upload do termo.' }
  }
}
