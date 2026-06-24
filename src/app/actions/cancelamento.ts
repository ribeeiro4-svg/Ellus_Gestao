'use server'

import { createClient } from '@supabase/supabase-js'

export async function efetivarCancelamentoAction(formData: FormData) {
  const associadoId = formData.get('associadoId') as string
  const file = formData.get('file') as File

  if (!associadoId || !file) {
    return { error: 'Dados inválidos para cancelamento.' }
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 1. Upload do arquivo via Service Role (ignora RLS)
    const fileExt = file.name.split('.').pop() || 'pdf'
    const fileName = `${associadoId}-${Date.now()}.${fileExt}`
    const filePath = `termos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('termos_cancelamento')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Erro no upload via Server Action:', uploadError)
      return { error: `Falha no upload do arquivo. Detalhes: ${uploadError.message}` }
    }

    const { data: { publicUrl: termoUrl } } = supabase.storage
      .from('termos_cancelamento')
      .getPublicUrl(filePath)

    // 2. Excluir lançamentos em 'aberto' deste associado
    const { error: errorLancamentos } = await supabase
      .from('lancamentos')
      .delete()
      .eq('associado_id', associadoId)
      .eq('status', 'aberto')

    if (errorLancamentos) {
      console.error('Erro ao excluir lançamentos abertos:', errorLancamentos)
      return { error: 'Falha ao remover cobranças em aberto.' }
    }

    // 2. Atualizar o status do associado para 'inativo' e salvar a URL do termo
    const { error: errorAssociado } = await supabase
      .from('associados')
      .update({
        status: 'inativo',
        termo_cancelamento_url: termoUrl
      })
      .eq('id', associadoId)

    if (errorAssociado) {
      console.error('Erro ao inativar associado:', errorAssociado)
      return { error: 'Falha ao inativar o associado.' }
    }

    return { success: true, termoUrl }
  } catch (error: any) {
    console.error('Erro inesperado no cancelamento:', error)
    return { error: 'Erro interno ao processar o cancelamento.' }
  }
}
