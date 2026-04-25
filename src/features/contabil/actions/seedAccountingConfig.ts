'use server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function seedAccountingConfigAction(providedTenantId?: string) {
  const sb = await createServerSupabase()
  const { data: { user } } = await sb.auth.getUser()
  
  let tenantId = providedTenantId || '971f92af-a72b-4bc4-a8e0-333d712ce6a7'

  if (user) {
    const { data: userData } = await sb.from('usuarios').select('tenant_id').eq('id', user.id).single()
    if (userData?.tenant_id) tenantId = userData.tenant_id
  }

  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '').trim()

  const mappings = [
    // Ingressos (Receitas)
    { categoria_nome: 'MENSALIDADES', conta_contabil_codigo: '3.1.1.01.001', conta_contabil_nome: 'Mensalidades de Associados', tipo: 'ingresso' },
    { categoria_nome: 'MENSALIDADE', conta_contabil_codigo: '3.1.1.01.001', conta_contabil_nome: 'Mensalidades de Associados', tipo: 'ingresso' },
    { categoria_nome: 'MENSALIDADE DE ASSOCIADO', conta_contabil_codigo: '3.1.1.01.001', conta_contabil_nome: 'Mensalidades de Associados', tipo: 'ingresso' },
    { categoria_nome: 'ADESÃO', conta_contabil_codigo: '3.1.1.01.002', conta_contabil_nome: 'Taxas de Adesão de Novos Membros', tipo: 'ingresso' },
    { categoria_nome: 'OUTROS', conta_contabil_codigo: '3.1.1.01.003', conta_contabil_nome: 'Outras Receitas Operacionais', tipo: 'ingresso' },
    
    // Dispêndios com Pessoal (Bolsas e Estagiários)
    { categoria_nome: 'PRÓ-LABORE (DIRETORIA)', conta_contabil_codigo: '4.2.1.01.001', conta_contabil_nome: 'Pró-Labore da Diretoria Executiva', tipo: 'dispendio' },
    { categoria_nome: 'Verba Diretoria / Administrativo', conta_contabil_codigo: '4.2.2.01.013', conta_contabil_nome: 'Outros Dispêndios Administrativos', tipo: 'dispendio' },
    { categoria_nome: 'VERBA DIRETORIA / ADMINISTRATIVO', conta_contabil_codigo: '4.2.2.01.013', conta_contabil_nome: 'Outros Dispêndios Administrativos', tipo: 'dispendio' },
    { categoria_nome: 'BOLSA AUXÍLIO (ESTAGIÁRIO)', conta_contabil_codigo: '4.1.1.01.003', conta_contabil_nome: 'Bolsa-Auxílio (Estagiários)', tipo: 'dispendio' },
    { categoria_nome: '13º BOLSA AUXÍLIO (ESTAGIÁRIO)', conta_contabil_codigo: '4.1.1.01.003', conta_contabil_nome: 'Bolsa-Auxílio (Estagiários)', tipo: 'dispendio' },
    { categoria_nome: '13° BOLSA AUXÍLIO (ESTAGIÁRIO)', conta_contabil_codigo: '4.1.1.01.003', conta_contabil_nome: 'Bolsa-Auxílio (Estagiários)', tipo: 'dispendio' },
    { categoria_nome: 'AUXÍLIOS ESTAGIÁRIO', conta_contabil_codigo: '4.1.1.01.004', conta_contabil_nome: 'Auxílio Transporte e Benefícios (Estagiários)', tipo: 'dispendio' },
    { categoria_nome: 'FÉRIAS REMUNERADAS (ESTAGIÁRIO)', conta_contabil_codigo: '4.1.1.01.003', conta_contabil_nome: 'Bolsa-Auxílio (Estagiários)', tipo: 'dispendio' },
    { categoria_nome: 'ESTAGIÁRIO - FUNDO DE RESERVA (FÉRIAS E 13º AUXÍLIO)', conta_contabil_codigo: '4.1.1.01.003', conta_contabil_nome: 'Bolsa-Auxílio (Estagiários)', tipo: 'dispendio' },
    { categoria_nome: 'ESTAGIÁRIO – FUNDO DE RESERVA (FÉRIAS E 13º AUXÍLIO)', conta_contabil_codigo: '4.1.1.01.003', conta_contabil_nome: 'Bolsa-Auxílio (Estagiários)', tipo: 'dispendio' },
    { categoria_nome: 'IMPOSTOS TRABALHISTAS', conta_contabil_codigo: '4.1.1.01.002', conta_contabil_nome: 'Encargos Sociais s/ Folha — Ativ. Fim', tipo: 'dispendio' },
    
    // Manutenção e Serviços
    { categoria_nome: 'CONTABILIDADE/JURÍDICO', conta_contabil_codigo: '4.2.2.01.008', conta_contabil_nome: 'Assessoria Contábil e Jurídica', tipo: 'dispendio' },
    { categoria_nome: 'CONTABILIDADE', conta_contabil_codigo: '4.2.2.01.008', conta_contabil_nome: 'Assessoria Contábil e Jurídica', tipo: 'dispendio' },
    { categoria_nome: 'JURÍDICO', conta_contabil_codigo: '4.2.2.01.008', conta_contabil_nome: 'Assessoria Contábil e Jurídica', tipo: 'dispendio' },
    { categoria_nome: 'SERVIÇOS CONTRATADOS PJ', conta_contabil_codigo: '4.2.2.01.007', conta_contabil_nome: 'Serviços de Terceiros - Pessoa Jurídica', tipo: 'dispendio' },
    { categoria_nome: 'SERVIÇOS TOMADOS', conta_contabil_codigo: '4.2.2.01.007', conta_contabil_nome: 'Serviços de Terceiros - Pessoa Jurídica', tipo: 'dispendio' },
    { categoria_nome: 'SOFTWARE OPERACIONAL', conta_contabil_codigo: '4.2.2.01.006', conta_contabil_nome: 'Manutenção de Sistemas e Software', tipo: 'dispendio' },
    { categoria_nome: 'PLANO PRÓ DE GESTÃO NO APP', conta_contabil_codigo: '4.2.2.01.006', conta_contabil_nome: 'Manutenção de Sistemas e Software', tipo: 'dispendio' },
    { categoria_nome: 'SERVIÇOS DE DESENVOLVIMENTO DE SOLUÇÕES (SAAS)', conta_contabil_codigo: '4.2.2.01.006', conta_contabil_nome: 'Manutenção de Sistemas e Software', tipo: 'dispendio' },
    { categoria_nome: 'INTERNET (WI-FI)', conta_contabil_codigo: '4.2.2.01.003', conta_contabil_nome: 'Serviços de Telecomunicações', tipo: 'dispendio' },
    { categoria_nome: 'INTERNET', conta_contabil_codigo: '4.2.2.01.003', conta_contabil_nome: 'Serviços de Telecomunicações', tipo: 'dispendio' },
    { categoria_nome: 'INFRAESTRUTURA', conta_contabil_codigo: '4.2.2.01.011', conta_contabil_nome: 'Manutenção de Infraestrutura e Reparos', tipo: 'dispendio' },
    { categoria_nome: 'ALUGUEL', conta_contabil_codigo: '4.2.2.01.002', conta_contabil_nome: 'Aluguéis e Arrendamentos', tipo: 'dispendio' },
    { categoria_nome: 'ENERGIA ELÉTRICA', conta_contabil_codigo: '4.2.2.01.001', conta_contabil_nome: 'Energia Elétrica', tipo: 'dispendio' },
    { categoria_nome: 'ÁGUA E ESGOTO', conta_contabil_codigo: '4.2.2.01.001', conta_contabil_nome: 'Água e Esgoto', tipo: 'dispendio' },
    { categoria_nome: 'TELEFONE', conta_contabil_codigo: '4.2.2.01.003', conta_contabil_nome: 'Serviços de Telecomunicações', tipo: 'dispendio' },
    { categoria_nome: 'MARKETING E PUBLICIDADE', conta_contabil_codigo: '4.2.2.01.010', conta_contabil_nome: 'Publicidade e Propaganda', tipo: 'dispendio' },
    
    // Materiais e Outros
    { categoria_nome: 'ARTIGOS DE GRÁFICA', conta_contabil_codigo: '4.2.2.01.009', conta_contabil_nome: 'Despesas com Gráfica e Impressos', tipo: 'dispendio' },
    { categoria_nome: 'MATERIAIS DE ESCRITÓRIO', conta_contabil_codigo: '4.2.2.01.004', conta_contabil_nome: 'Materiais de Escritório e Expediente', tipo: 'dispendio' },
    { categoria_nome: 'MATERIAIS DE ESCRITÓRIO (PAPELARIA)', conta_contabil_codigo: '4.2.2.01.004', conta_contabil_nome: 'Materiais de Escritório e Expediente', tipo: 'dispendio' },
    { categoria_nome: 'MATERIAIS USO E CONSUMO DA SEDE', conta_contabil_codigo: '4.2.2.01.005', conta_contabil_nome: 'Materiais de Limpeza e Consumo da Sede', tipo: 'dispendio' },
    { categoria_nome: 'USO E CONSUMO', conta_contabil_codigo: '4.2.2.01.005', conta_contabil_nome: 'Materiais de Limpeza e Consumo da Sede', tipo: 'dispendio' },
    { categoria_nome: 'SUPRIMENTOS', conta_contabil_codigo: '4.2.2.01.005', conta_contabil_nome: 'Materiais de Limpeza e Consumo da Sede', tipo: 'dispendio' },
    { categoria_nome: 'RESERVA DE EMERGÊNCIA', conta_contabil_codigo: '1.1.1.03.001', conta_contabil_nome: 'Aplicações de Liquidez Imediata', tipo: 'dispendio' },
    { categoria_nome: 'EMPRÉSTIMOS (DIRETORIA)', conta_contabil_codigo: '1.1.2.02.001', conta_contabil_nome: 'Adiantamentos a Empregados', tipo: 'dispendio' },
    { categoria_nome: 'TAXAS BANCÁRIAS', conta_contabil_codigo: '4.2.2.01.012', conta_contabil_nome: 'Taxas e Tarifas Bancárias', tipo: 'dispendio' },
    { categoria_nome: 'TARIFAS BANCÁRIAS', conta_contabil_codigo: '4.2.2.01.012', conta_contabil_nome: 'Taxas e Tarifas Bancárias', tipo: 'dispendio' },
    { categoria_nome: 'VIAGENS E HOSPEDAGENS', conta_contabil_codigo: '4.2.2.01.013', conta_contabil_nome: 'Outros Dispêndios Administrativos', tipo: 'dispendio' },
    { categoria_nome: 'ALIMENTAÇÃO', conta_contabil_codigo: '4.1.1.01.004', conta_contabil_nome: 'Benefícios e Auxílios a Empregados', tipo: 'dispendio' },
    { categoria_nome: 'IMPOSTOS E TAXAS', conta_contabil_codigo: '4.2.2.01.013', conta_contabil_nome: 'Outros Dispêndios Administrativos', tipo: 'dispendio' },
    { categoria_nome: 'OUTROS (DESPESA)', conta_contabil_codigo: '4.2.2.01.013', conta_contabil_nome: 'Outros Dispêndios Administrativos', tipo: 'dispendio' },
    { categoria_nome: 'TRANSPORTE', conta_contabil_codigo: '4.1.1.01.004', conta_contabil_nome: 'Benefícios e Auxílios a Empregados', tipo: 'dispendio' },
    { categoria_nome: 'TROCO', conta_contabil_codigo: '1.1.1.01.001', conta_contabil_nome: 'Caixa Geral', tipo: 'dispendio' },
  ]

  // 1. Upsert mapeamentos padrão
  const records = mappings.map(m => ({
    tenant_id: tenantId,
    ...m,
    updated_at: new Date().toISOString()
  }))

  await sb.from('configuracoes_contabeis').upsert(records, { onConflict: 'tenant_id,categoria_nome' })

  // 2. Busca categorias existentes nos lançamentos que não estão mapeadas
  const { data: categoriasFinanceiras } = await sb
    .from('lancamentos')
    .select('categoria, tipo')
    .eq('tenant_id', tenantId)

  if (!categoriasFinanceiras) return { success: true }

  // Deduplica e normaliza
  const uniqueCats = Array.from(new Set(categoriasFinanceiras.map(c => JSON.stringify({ n: normalize(c.categoria), t: c.tipo, original: c.categoria }))))
    .map(s => JSON.parse(s))

  // Busca mapeamentos atuais para comparar
  const { data: currentMaps } = await sb.from('configuracoes_contabeis').select('categoria_nome, tipo').eq('tenant_id', tenantId)
  const mappedNorms = (currentMaps || []).map(m => `${normalize(m.categoria_nome)}|${m.tipo}`)

  let createdCount = 0

  for (const cat of uniqueCats) {
    const targetTipo = cat.t === 'receita' ? 'ingresso' : 'dispendio'
    const key = `${cat.n}|${targetTipo}`

    if (!mappedNorms.includes(key)) {
      // Criar nova conta e mapeamento
      const parentCodigo = targetTipo === 'ingresso' ? '3.1.1.01' : '4.2.2.01'
      
      // Acha o próximo código sequencial
      const { data: lastAccounts } = await sb
        .from('plano_contas')
        .select('codigo')
        .eq('tenant_id', tenantId)
        .like('codigo', `${parentCodigo}.%`)
        .order('codigo', { ascending: false })
        .limit(1)

      let nextSeq = 100
      if (lastAccounts && lastAccounts.length > 0) {
        const lastPart = lastAccounts[0].codigo.split('.').pop()
        const lastNum = parseInt(lastPart || '0', 10)
        if (!isNaN(lastNum) && lastNum >= 100) nextSeq = lastNum + 1
      } else {
        // Se não houver subcontas, começa do .001 se for o caso, mas aqui estamos usando o padrão .100+ para dinâmicas
        nextSeq = 100 
      }

      const novoCodigo = `${parentCodigo}.${String(nextSeq).padStart(3, '0')}`
      const { data: pai } = await sb.from('plano_contas').select('id').eq('tenant_id', tenantId).eq('codigo', parentCodigo).single()

      // Cria a conta
      const { data: novaConta } = await sb.from('plano_contas').insert({
        tenant_id: tenantId,
        codigo: novoCodigo,
        descricao: cat.original,
        nivel: 5,
        tipo: 'analitica',
        natureza: targetTipo === 'ingresso' ? 'credora' : 'devedora',
        classificacao: targetTipo === 'ingresso' ? 'ingresso' : 'despesa',
        aceita_lancamentos: true,
        ativa: true,
        conta_pai_id: pai?.id || null
      }).select('id').single()

      if (novaConta) {
        // Cria o mapeamento
        await sb.from('configuracoes_contabeis').insert({
          tenant_id: tenantId,
          categoria_nome: cat.original,
          conta_contabil_codigo: novoCodigo,
          conta_contabil_nome: cat.original,
          tipo: targetTipo,
          updated_at: new Date().toISOString()
        })
        createdCount++
        mappedNorms.push(key) // Evita duplicados no mesmo loop
      }
    }
  }

  return { success: true, createdCount, error: null }
}
