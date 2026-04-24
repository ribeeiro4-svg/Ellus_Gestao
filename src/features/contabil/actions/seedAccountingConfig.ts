'use server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function seedAccountingConfigAction() {
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  // 1. Obter o tenant_id do usuário (assumindo que está no metadata ou tabela de perfil)
  const { data: profile } = await sb.from('profiles').select('tenant_id').eq('id', user.id).single()
  const tenantId = profile?.tenant_id || '971f92af-a72b-4bc4-a8e0-333d712ce6a7' // Fallback para ID fixo ACPROBEC

  const mappings = [
    // Ingressos
    { categoria_nome: 'MENSALIDADES', conta_contabil_codigo: '3.1.1.01.001', conta_contabil_nome: 'Mensalidades de Associados', tipo: 'ingresso' },
    { categoria_nome: 'ADESÃO', conta_contabil_codigo: '3.1.1.01.002', conta_contabil_nome: 'Taxas de Adesão de Novos Membros', tipo: 'ingresso' },
    
    // Dispêndios com Pessoal (Bolsas e Estagiários)
    { categoria_nome: 'PRÓ-LABORE (DIRETORIA)', conta_contabil_codigo: '4.2.1.01.001', conta_contabil_nome: 'Pró-Labore da Diretoria Executiva', tipo: 'dispendio' },
    { categoria_nome: 'BOLSA AUXÍLIO (ESTAGIÁRIO)', conta_contabil_codigo: '4.1.1.01.001', conta_contabil_nome: 'Salários e Ordenados — Ativ. Fim', tipo: 'dispendio' },
    { categoria_nome: '13º BOLSA AUXÍLIO (ESTAGIÁRIO)', conta_contabil_codigo: '4.1.1.01.001', conta_contabil_nome: 'Salários e Ordenados — Ativ. Fim', tipo: 'dispendio' },
    { categoria_nome: '13° BOLSA AUXÍLIO (ESTAGIÁRIO)', conta_contabil_codigo: '4.1.1.01.001', conta_contabil_nome: 'Salários e Ordenados — Ativ. Fim', tipo: 'dispendio' }, // Variação com °
    { categoria_nome: 'AUXÍLIOS ESTAGIÁRIO', conta_contabil_codigo: '4.1.1.01.001', conta_contabil_nome: 'Salários e Ordenados — Ativ. Fim', tipo: 'dispendio' },
    { categoria_nome: 'FÉRIAS REMUNERADAS (ESTAGIÁRIO)', conta_contabil_codigo: '4.1.1.01.001', conta_contabil_nome: 'Salários e Ordenados — Ativ. Fim', tipo: 'dispendio' },
    { categoria_nome: 'ESTAGIÁRIO - FUNDO DE RESERVA (FÉRIAS E 13º AUXÍLIO)', conta_contabil_codigo: '4.1.1.01.001', conta_contabil_nome: 'Salários e Ordenados — Ativ. Fim', tipo: 'dispendio' },
    { categoria_nome: 'ESTAGIÁRIO – FUNDO DE RESERVA (FÉRIAS E 13º AUXÍLIO)', conta_contabil_codigo: '4.1.1.01.001', conta_contabil_nome: 'Salários e Ordenados — Ativ. Fim', tipo: 'dispendio' }, // Variação com travessão
    { categoria_nome: 'IMPOSTOS TRABALHISTAS', conta_contabil_codigo: '4.1.1.01.002', conta_contabil_nome: 'Encargos Sociais s/ Folha — Ativ. Fim', tipo: 'dispendio' },
    
    // Manutenção e Serviços
    { categoria_nome: 'CONTABILIDADE/JURÍDICO', conta_contabil_codigo: '4.2.2.01.008', conta_contabil_nome: 'Assessoria Contábil e Jurídica', tipo: 'dispendio' },
    { categoria_nome: 'SERVIÇOS CONTRATADOS PJ', conta_contabil_codigo: '4.2.2.01.007', conta_contabil_nome: 'Serviços de Terceiros - Pessoa Jurídica', tipo: 'dispendio' },
    { categoria_nome: 'SOFTWARE OPERACIONAL', conta_contabil_codigo: '4.2.2.01.006', conta_contabil_nome: 'Manutenção de Sistemas e Software', tipo: 'dispendio' },
    { categoria_nome: 'INTERNET (WI-FI)', conta_contabil_codigo: '4.2.2.01.003', conta_contabil_nome: 'Serviços de Telecomunicações', tipo: 'dispendio' },
    { categoria_nome: 'INFRAESTRUTURA', conta_contabil_codigo: '4.2.2.01.011', conta_contabil_nome: 'Manutenção de Infraestrutura e Reparos', tipo: 'dispendio' },
    
    // Materiais e Outros
    { categoria_nome: 'ARTIGOS DE GRÁFICA', conta_contabil_codigo: '4.2.2.01.009', conta_contabil_nome: 'Despesas com Gráfica e Impressos', tipo: 'dispendio' },
    { categoria_nome: 'MATERIAIS DE ESCRITÓRIO', conta_contabil_codigo: '4.2.2.01.004', conta_contabil_nome: 'Materiais de Escritório e Expediente', tipo: 'dispendio' },
    { categoria_nome: 'MATERIAIS USO E CONSUMO DA SEDE', conta_contabil_codigo: '4.2.2.01.005', conta_contabil_nome: 'Materiais de Limpeza e Consumo da Sede', tipo: 'dispendio' },
    { categoria_nome: 'RESERVA DE EMERGÊNCIA', conta_contabil_codigo: '1.1.1.03.001', conta_contabil_nome: 'Aplicações de Liquidez Imediata', tipo: 'dispendio' },
    { categoria_nome: 'EMPRÉSTIMOS (DIRETORIA)', conta_contabil_codigo: '1.1.2.02.001', conta_contabil_nome: 'Adiantamentos a Empregados', tipo: 'dispendio' },
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
