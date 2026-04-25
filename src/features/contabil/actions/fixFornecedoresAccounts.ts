'use server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function fixFornecedoresAccountsAction(providedTenantId?: string) {
  const sb = await createServerSupabase()
  
  const { data: userData } = await sb.auth.getUser()
  let tenantId = providedTenantId || '971f92af-a72b-4bc4-a8e0-333d712ce6a7'

  if (userData?.user) {
    const { data: usuario } = await sb.from('usuarios').select('tenant_id').eq('id', userData.user.id).single()
    if (usuario?.tenant_id) tenantId = usuario.tenant_id
  }

  // Busca fornecedores sem conta
  const { data: fornecedores } = await sb.from('fornecedores').select('id, nome').eq('tenant_id', tenantId).is('conta_contabil_id', null)
  
  if (!fornecedores || fornecedores.length === 0) return { success: true, message: 'Nenhum fornecedor sem conta' }

  let count = 0
  
  for (const f of fornecedores) {
    // Acha a última conta para gerar código sequencial (2.1.3.01.XXX)
    const { data: ultimasContas } = await sb.from('plano_contas')
      .select('codigo')
      .eq('tenant_id', tenantId)
      .like('codigo', '2.1.3.01.%')
      .order('codigo', { ascending: false })
      .limit(1)

    let novoCodigo = '2.1.3.01.100'
    if (ultimasContas && ultimasContas.length > 0) {
      const ultimo = ultimasContas[0].codigo
      const partes = ultimo.split('.')
      const sequencial = parseInt(partes[partes.length - 1], 10)
      if (!isNaN(sequencial) && sequencial >= 100) {
        novoCodigo = `2.1.3.01.${String(sequencial + 1).padStart(3, '0')}`
      }
    }

    const { data: pai } = await sb.from('plano_contas').select('id').eq('tenant_id', tenantId).eq('codigo', '2.1.3.01').single()

    const { data: novaConta } = await sb.from('plano_contas').insert({
      tenant_id: tenantId,
      codigo: novoCodigo,
      descricao: `Fornecedor: ${f.nome}`,
      nivel: 5,
      tipo: 'analitica',
      natureza: 'credora',
      classificacao: 'passivo',
      aceita_lancamentos: true,
      ativa: true,
      conta_pai_id: pai?.id || null
    }).select('id').single()

    if (novaConta) {
      await sb.from('fornecedores').update({ conta_contabil_id: novaConta.id }).eq('id', f.id)
      count++
    }
  }

  return { success: true, count }
}
