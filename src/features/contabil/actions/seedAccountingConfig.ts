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
    // ── INGRESSOS ──────────────────────────────────────────────────────────
    // Pai correto: 4.1.1 (CONTRIBUIÇÕES E MENSALIDADES) — nunca Patrimônio Social
    { categoria_nome: 'MENSALIDADES', conta_contabil_codigo: '4.1.1.01', conta_contabil_nome: 'Mensalidades de Associados', tipo: 'ingresso' },
    { categoria_nome: 'MENSALIDADE', conta_contabil_codigo: '4.1.1.01', conta_contabil_nome: 'Mensalidades de Associados', tipo: 'ingresso' },
    { categoria_nome: 'MENSALIDADE DE ASSOCIADO', conta_contabil_codigo: '4.1.1.01', conta_contabil_nome: 'Mensalidades de Associados', tipo: 'ingresso' },
    { categoria_nome: 'ADESÃO', conta_contabil_codigo: '4.1.1.02', conta_contabil_nome: 'Taxa de Adesão', tipo: 'ingresso' },
    { categoria_nome: 'OUTROS', conta_contabil_codigo: '4.3.1.02', conta_contabil_nome: 'Ingressos Eventuais', tipo: 'ingresso' },
    { categoria_nome: 'DOAÇÕES', conta_contabil_codigo: '4.1.2.02', conta_contabil_nome: 'Doações de Pessoas Físicas', tipo: 'ingresso' },
    { categoria_nome: 'SUBVENÇÕES', conta_contabil_codigo: '4.1.2.01', conta_contabil_nome: 'Subvenções Governamentais', tipo: 'ingresso' },
    { categoria_nome: 'EVENTOS', conta_contabil_codigo: '4.1.3.01', conta_contabil_nome: 'Receita de Eventos', tipo: 'ingresso' },
    { categoria_nome: 'RENDIMENTOS', conta_contabil_codigo: '4.2.1.01', conta_contabil_nome: 'Rendimentos de Aplicações Financeiras', tipo: 'ingresso' },

    // ── DISPÊNDIOS COM PESSOAL ─────────────────────────────────────────────
    { categoria_nome: 'PRÓ-LABORE (DIRETORIA)', conta_contabil_codigo: '5.2.1.02', conta_contabil_nome: 'Pró-Labore da Diretoria', tipo: 'dispendio' },
    { categoria_nome: 'Verba Diretoria / Administrativo', conta_contabil_codigo: '5.2.1.05', conta_contabil_nome: 'Verba de Representação — Diretoria', tipo: 'dispendio' },
    { categoria_nome: 'VERBA DIRETORIA / ADMINISTRATIVO', conta_contabil_codigo: '5.2.1.05', conta_contabil_nome: 'Verba de Representação — Diretoria', tipo: 'dispendio' },
    { categoria_nome: 'BOLSA AUXÍLIO (ESTAGIÁRIO)', conta_contabil_codigo: '5.1.1.03', conta_contabil_nome: 'Bolsas de Estágio — Ativ. Fim', tipo: 'dispendio' },
    { categoria_nome: '13º BOLSA AUXÍLIO (ESTAGIÁRIO)', conta_contabil_codigo: '5.1.1.03', conta_contabil_nome: 'Bolsas de Estágio — Ativ. Fim', tipo: 'dispendio' },
    { categoria_nome: '13° BOLSA AUXÍLIO (ESTAGIÁRIO)', conta_contabil_codigo: '5.1.1.03', conta_contabil_nome: 'Bolsas de Estágio — Ativ. Fim', tipo: 'dispendio' },
    { categoria_nome: 'AUXÍLIOS ESTAGIÁRIO', conta_contabil_codigo: '5.1.1.03', conta_contabil_nome: 'Bolsas de Estágio — Ativ. Fim', tipo: 'dispendio' },
    { categoria_nome: 'FÉRIAS REMUNERADAS (ESTAGIÁRIO)', conta_contabil_codigo: '5.1.1.03', conta_contabil_nome: 'Bolsas de Estágio — Ativ. Fim', tipo: 'dispendio' },
    { categoria_nome: 'ESTAGIÁRIO - FUNDO DE RESERVA (FÉRIAS E 13º AUXÍLIO)', conta_contabil_codigo: '5.1.1.03', conta_contabil_nome: 'Bolsas de Estágio — Ativ. Fim', tipo: 'dispendio' },
    { categoria_nome: 'ESTAGIÁRIO – FUNDO DE RESERVA (FÉRIAS E 13º AUXÍLIO)', conta_contabil_codigo: '5.1.1.03', conta_contabil_nome: 'Bolsas de Estágio — Ativ. Fim', tipo: 'dispendio' },
    { categoria_nome: 'IMPOSTOS TRABALHISTAS', conta_contabil_codigo: '5.1.1.02', conta_contabil_nome: 'Encargos Sociais — Ativ. Fim', tipo: 'dispendio' },

    // ── DISPÊNDIOS OPERACIONAIS ────────────────────────────────────────────
    { categoria_nome: 'CONTABILIDADE/JURÍDICO', conta_contabil_codigo: '5.2.2.05', conta_contabil_nome: 'Serviços Contábeis', tipo: 'dispendio' },
    { categoria_nome: 'CONTABILIDADE', conta_contabil_codigo: '5.2.2.05', conta_contabil_nome: 'Serviços Contábeis', tipo: 'dispendio' },
    { categoria_nome: 'JURÍDICO', conta_contabil_codigo: '5.2.2.06', conta_contabil_nome: 'Serviços Jurídicos', tipo: 'dispendio' },
    { categoria_nome: 'SERVIÇOS CONTRATADOS PJ', conta_contabil_codigo: '5.2.2.11', conta_contabil_nome: 'Outros Serviços de Terceiros — Admin.', tipo: 'dispendio' },
    { categoria_nome: 'SERVIÇOS TOMADOS', conta_contabil_codigo: '5.1.3.02', conta_contabil_nome: 'Serviços Tomados — Ativ. Fim', tipo: 'dispendio' },
    { categoria_nome: 'SOFTWARE OPERACIONAL', conta_contabil_codigo: '5.2.2.09', conta_contabil_nome: 'Serviços de TI e Assinaturas de Software', tipo: 'dispendio' },
    { categoria_nome: 'PLANO PRÓ DE GESTÃO NO APP', conta_contabil_codigo: '5.2.2.09', conta_contabil_nome: 'Serviços de TI e Assinaturas de Software', tipo: 'dispendio' },
    { categoria_nome: 'SERVIÇOS DE DESENVOLVIMENTO DE SOLUÇÕES (SAAS)', conta_contabil_codigo: '5.2.2.09', conta_contabil_nome: 'Serviços de TI e Assinaturas de Software', tipo: 'dispendio' },
    { categoria_nome: 'INTERNET (WI-FI)', conta_contabil_codigo: '5.2.2.03', conta_contabil_nome: 'Telefone e Internet', tipo: 'dispendio' },
    { categoria_nome: 'INTERNET', conta_contabil_codigo: '5.2.2.03', conta_contabil_nome: 'Telefone e Internet', tipo: 'dispendio' },
    { categoria_nome: 'INFRAESTRUTURA', conta_contabil_codigo: '5.2.2.08', conta_contabil_nome: 'Manutenção Predial e Equipamentos', tipo: 'dispendio' },
    { categoria_nome: 'ALUGUEL', conta_contabil_codigo: '5.2.2.01', conta_contabil_nome: 'Aluguel e Condomínio', tipo: 'dispendio' },
    { categoria_nome: 'ENERGIA ELÉTRICA', conta_contabil_codigo: '5.2.2.02', conta_contabil_nome: 'Energia Elétrica', tipo: 'dispendio' },
    { categoria_nome: 'ÁGUA E ESGOTO', conta_contabil_codigo: '5.2.2.02', conta_contabil_nome: 'Energia Elétrica', tipo: 'dispendio' },
    { categoria_nome: 'TELEFONE', conta_contabil_codigo: '5.2.2.03', conta_contabil_nome: 'Telefone e Internet', tipo: 'dispendio' },
    { categoria_nome: 'MARKETING E PUBLICIDADE', conta_contabil_codigo: '5.2.2.11', conta_contabil_nome: 'Outros Serviços de Terceiros — Admin.', tipo: 'dispendio' },
    { categoria_nome: 'ARTIGOS DE GRÁFICA', conta_contabil_codigo: '5.2.2.04', conta_contabil_nome: 'Materiais de Escritório e Consumo', tipo: 'dispendio' },
    { categoria_nome: 'MATERIAIS DE ESCRITÓRIO', conta_contabil_codigo: '5.2.2.04', conta_contabil_nome: 'Materiais de Escritório e Consumo', tipo: 'dispendio' },
    { categoria_nome: 'MATERIAIS DE ESCRITÓRIO (PAPELARIA)', conta_contabil_codigo: '5.2.2.04', conta_contabil_nome: 'Materiais de Escritório e Consumo', tipo: 'dispendio' },
    { categoria_nome: 'MATERIAIS USO E CONSUMO DA SEDE', conta_contabil_codigo: '5.2.2.04', conta_contabil_nome: 'Materiais de Escritório e Consumo', tipo: 'dispendio' },
    { categoria_nome: 'USO E CONSUMO', conta_contabil_codigo: '5.2.2.04', conta_contabil_nome: 'Materiais de Escritório e Consumo', tipo: 'dispendio' },
    { categoria_nome: 'SUPRIMENTOS', conta_contabil_codigo: '5.2.2.04', conta_contabil_nome: 'Materiais de Escritório e Consumo', tipo: 'dispendio' },
    { categoria_nome: 'RESERVA DE EMERGÊNCIA', conta_contabil_codigo: '1.1.1.03', conta_contabil_nome: 'Aplicações de Liquidez Imediata', tipo: 'dispendio' },
    { categoria_nome: 'EMPRÉSTIMOS (DIRETORIA)', conta_contabil_codigo: '1.1.2.04', conta_contabil_nome: 'Adiantamentos a Empregados', tipo: 'dispendio' },
    { categoria_nome: 'TAXAS BANCÁRIAS', conta_contabil_codigo: '5.2.3.02', conta_contabil_nome: 'Tarifas Bancárias', tipo: 'dispendio' },
    { categoria_nome: 'TARIFAS BANCÁRIAS', conta_contabil_codigo: '5.2.3.02', conta_contabil_nome: 'Tarifas Bancárias', tipo: 'dispendio' },
    { categoria_nome: 'VIAGENS E HOSPEDAGENS', conta_contabil_codigo: '5.2.2.11', conta_contabil_nome: 'Outros Serviços de Terceiros — Admin.', tipo: 'dispendio' },
    { categoria_nome: 'ALIMENTAÇÃO', conta_contabil_codigo: '5.2.2.11', conta_contabil_nome: 'Outros Serviços de Terceiros — Admin.', tipo: 'dispendio' },
    { categoria_nome: 'IMPOSTOS E TAXAS', conta_contabil_codigo: '5.2.3.02', conta_contabil_nome: 'Tarifas Bancárias', tipo: 'dispendio' },
    { categoria_nome: 'OUTROS (DESPESA)', conta_contabil_codigo: '5.2.2.11', conta_contabil_nome: 'Outros Serviços de Terceiros — Admin.', tipo: 'dispendio' },
    { categoria_nome: 'TRANSPORTE', conta_contabil_codigo: '5.2.2.10', conta_contabil_nome: 'Serviços de Transporte e Mobilidade', tipo: 'dispendio' },
    { categoria_nome: 'TROCO', conta_contabil_codigo: '1.1.1.01', conta_contabil_nome: 'Caixa Geral', tipo: 'dispendio' },
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
      const parentCodigo = targetTipo === 'ingresso' ? '4.1.1' : '5.2.2'
      
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
