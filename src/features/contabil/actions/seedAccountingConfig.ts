'use server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function seedAccountingConfigAction() {
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  // 1. Obter o tenant_id do usuário (assumindo que está no metadata ou tabela de perfil)
  const { data: profile } = await sb.from('profiles').select('tenant_id').eq('id', user.id).single()
  const tenantId = profile?.tenant_id
  if (!tenantId) return { error: 'Tenant não encontrado' }

  const mappings = [
    // Ingressos
    { categoria_nome: 'Mensalidade', conta_contabil_codigo: '3.1.1.01.001', conta_contabil_nome: 'Mensalidades de Associados', tipo: 'ingresso' },
    { categoria_nome: 'Taxa de Adesão', conta_contabil_codigo: '3.1.1.01.002', conta_contabil_nome: 'Taxas de Adesão', tipo: 'ingresso' },
    { categoria_nome: 'Doações', conta_contabil_codigo: '3.1.2.01.001', conta_contabil_nome: 'Doações de Pessoas Físicas', tipo: 'ingresso' },
    { categoria_nome: 'Cursos / Eventos', conta_contabil_codigo: '3.2.1.01.001', conta_contabil_nome: 'Inscrições em Cursos Livres', tipo: 'ingresso' },
    { categoria_nome: 'Inscrição Curso', conta_contabil_codigo: '3.2.1.01.001', conta_contabil_nome: 'Inscrições em Cursos Livres', tipo: 'ingresso' },
    
    // Dispêndios
    { categoria_nome: 'Salário', conta_contabil_codigo: '4.1.1.01.001', conta_contabil_nome: 'Salários e Ordenados', tipo: 'dispendio' },
    { categoria_nome: 'Folha de Pagamento', conta_contabil_codigo: '4.1.1.01.001', conta_contabil_nome: 'Salários e Ordenados', tipo: 'dispendio' },
    { categoria_nome: 'FGTS / INSS', conta_contabil_codigo: '4.1.1.01.002', conta_contabil_nome: 'Encargos Sociais', tipo: 'dispendio' },
    { categoria_nome: 'Pró-Labore', conta_contabil_codigo: '4.2.1.01.001', conta_contabil_nome: 'Pró-Labore da Diretoria', tipo: 'dispendio' },
    { categoria_nome: 'Diretoria', conta_contabil_codigo: '4.2.1.01.001', conta_contabil_nome: 'Pró-Labore da Diretoria', tipo: 'dispendio' },
    { categoria_nome: 'Energia Elétrica', conta_contabil_codigo: '4.2.2.01.001', conta_contabil_nome: 'Energia Elétrica e Água', tipo: 'dispendio' },
    { categoria_nome: 'Água e Esgoto', conta_contabil_codigo: '4.2.2.01.001', conta_contabil_nome: 'Energia Elétrica e Água', tipo: 'dispendio' },
    { categoria_nome: 'Aluguel', conta_contabil_codigo: '4.2.2.01.002', conta_contabil_nome: 'Alugueis de Imóveis', tipo: 'dispendio' },
    { categoria_nome: 'Software / SaaS', conta_contabil_codigo: '4.2.2.01.003', conta_contabil_nome: 'Serviços de Tecnologia (SaaS)', tipo: 'dispendio' },
    { categoria_nome: 'Tarifas Bancárias', conta_contabil_codigo: '4.2.3.01.001', conta_contabil_nome: 'Tarifas e Comissões Bancárias', tipo: 'dispendio' },
    { categoria_nome: 'Taxas Bancárias', conta_contabil_codigo: '4.2.3.01.001', conta_contabil_nome: 'Tarifas e Comissões Bancárias', tipo: 'dispendio' },
    { categoria_nome: 'Cora', conta_contabil_codigo: '4.2.3.01.001', conta_contabil_nome: 'Tarifas e Comissões Bancárias', tipo: 'dispendio' },
    { categoria_nome: 'Outros', conta_contabil_codigo: '4.2.4.01.001', conta_contabil_nome: 'Despesas Gerais de Pequeno Valor', tipo: 'dispendio' },
  ]

  const records = mappings.map(m => ({
    tenant_id: tenantId,
    ...m,
    updated_at: new Date().toISOString()
  }))

  const { error } = await sb
    .from('configuracoes_contabeis')
    .upsert(records, { onConflict: 'tenant_id,categoria_nome' })

  return { success: !error, error: error?.message }
}
