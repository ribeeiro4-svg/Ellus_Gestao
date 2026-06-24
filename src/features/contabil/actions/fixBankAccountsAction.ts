'use server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function fixBankAccountsAction(providedTenantId?: string) {
  const sb = await createServerSupabase()
  
  const { data: userData } = await sb.auth.getUser()
  let tenantId = providedTenantId || '971f92af-a72b-4bc4-a8e0-333d712ce6a7'

  if (userData?.user) {
    const { data: usuario } = await sb.from('usuarios').select('tenant_id').eq('id', userData.user.id).single()
    if (usuario?.tenant_id) tenantId = usuario.tenant_id
  }

  const { data: contasBancarias } = await sb.from('contas_bancarias').select('*').eq('tenant_id', tenantId)
  
  if (!contasBancarias || contasBancarias.length === 0) return { success: true, message: 'Nenhuma conta bancária encontrada' }

  let count = 0
  
  for (const conta of contasBancarias) {
    const mappingKey = `banco_${conta.id}`
    const { data: existingMap } = await sb.from('configuracoes_contabeis')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('categoria_nome', mappingKey)
      .single()

    if (existingMap) continue

    // NOVO PADRÃO ITG 2002:
    // 1.1.1.1 -> Caixa
    // 1.1.1.2 -> Bancos conta Movimento
    const parentCodigo = conta.tipo === 'caixa_fisico' ? '1.1.1.1' : '1.1.1.2'
    
    const { data: ultimasContas } = await sb.from('plano_contas')
      .select('codigo')
      .eq('tenant_id', tenantId)
      .like('codigo', `${parentCodigo}.%`)
      .order('codigo', { ascending: false })
      .limit(1)

    let nextSeq = 100
    if (ultimasContas && ultimasContas.length > 0) {
      const ultimo = ultimasContas[0].codigo
      const partes = ultimo.split('.')
      const sequencial = parseInt(partes[partes.length - 1], 10)
      if (!isNaN(sequencial) && sequencial >= 100) {
        nextSeq = sequencial + 1
      }
    }

    const novoCodigo = `${parentCodigo}.${String(nextSeq).padStart(3, '0')}`
    const { data: pai } = await sb.from('plano_contas').select('id').eq('tenant_id', tenantId).eq('codigo', parentCodigo).single()

    const { data: novaConta } = await sb.from('plano_contas').insert({
      tenant_id: tenantId,
      codigo: novoCodigo,
      descricao: `Banco: ${conta.nome}`,
      nivel: 5,
      tipo: 'analitica',
      natureza: 'devedora',
      classificacao: 'ativo',
      aceita_lancamentos: true,
      ativa: true,
      conta_pai_id: pai?.id || null
    }).select('id').single()

    if (novaConta) {
      await sb.from('configuracoes_contabeis').insert({
        tenant_id: tenantId,
        categoria_nome: mappingKey,
        conta_contabil_codigo: novoCodigo,
        conta_contabil_nome: `Banco: ${conta.nome}`,
        tipo: 'dispendio',
        updated_at: new Date().toISOString()
      })
      count++
    }
  }

  if (count > 0) {
    const { createClient } = await import('@supabase/supabase-js')
    const sbAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    
    await sbAdmin.from('contabil_logs').insert({
      tenant_id: tenantId,
      acao: 'MAPEAMENTO BANCO',
      detalhes: `Mapeamento automático concluído. ${count} novas contas contábeis analíticas foram criadas e vinculadas aos bancos cadastrados no padrão ITG 2002.`
    })
  }

  return { success: true, count }
}
