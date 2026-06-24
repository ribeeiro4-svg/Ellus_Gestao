'use server'
import { createServerSupabase } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Script de Semente (Seed) e Correção Automática para Mapeamento Contábil
 * Alinhado ao ITG 2002 (R1)
 */
export async function seedAccountingConfigAction(tenantId: string) {
  const sb = await createServerSupabase()
  const normalize = (s: string) => s.trim().toUpperCase()
  
  // 0. Limpeza de Legado: Remove mapeamentos que apontam para o plano antigo (5.x) ou contas inexistentes
  const { data: allContas } = await sb.from('plano_contas').select('codigo').eq('tenant_id', tenantId).eq('ativa', true)
  const validCodigos = new Set(allContas?.map(c => c.codigo) || [])
  
  const { data: mapsToClean } = await sb.from('configuracoes_contabeis').select('id, conta_contabil_codigo').eq('tenant_id', tenantId)
  
  const idsToDelete = (mapsToClean || [])
    .filter(m => m.conta_contabil_codigo.startsWith('5.') || !validCodigos.has(m.conta_contabil_codigo))
    .map(m => m.id)
    
  if (idsToDelete.length > 0) {
    await sb.from('configuracoes_contabeis').delete().in('id', idsToDelete)
  }

  // 1. Mapeamentos Estáticos (Hardcoded) — Prioridade Máxima
  const mappings = [
    { categoria_nome: 'MENSALIDADE', conta_contabil_codigo: '3.1.1', conta_contabil_nome: 'Mensalidades de Associados', tipo: 'ingresso' },
    { categoria_nome: 'MENSALIDADES', conta_contabil_codigo: '3.1.1', conta_contabil_nome: 'Mensalidades de Associados', tipo: 'ingresso' },
    { categoria_nome: 'DOAÇÕES', conta_contabil_codigo: '3.2', conta_contabil_nome: 'Doações e subvenções', tipo: 'ingresso' },
    { categoria_nome: 'ADESÃO', conta_contabil_codigo: '3.1.3', conta_contabil_nome: 'Taxas de Adesão', tipo: 'ingresso' },
    { categoria_nome: 'PROMOÇÕES', conta_contabil_codigo: '3.3', conta_contabil_nome: 'Promoções', tipo: 'ingresso' },
    { categoria_nome: 'CURSOS', conta_contabil_codigo: '3.4', conta_contabil_nome: 'Cursos e palestras', tipo: 'ingresso' },
    { categoria_nome: 'JUROS RECEBIDOS', conta_contabil_codigo: '3.5.2', conta_contabil_nome: 'Juros ativos', tipo: 'ingresso' },
    
    { categoria_nome: 'SALÁRIOS', conta_contabil_codigo: '4.2.2', conta_contabil_nome: 'Ordenados e Salários', tipo: 'dispendio' },
    { categoria_nome: 'FGTS', conta_contabil_codigo: '4.2.7', conta_contabil_nome: 'FGTS', tipo: 'dispendio' },
    { categoria_nome: 'INSS', conta_contabil_codigo: '4.2.6', conta_contabil_nome: 'INSS', tipo: 'dispendio' },
    { categoria_nome: 'FÉRIAS', conta_contabil_codigo: '4.2.4', conta_contabil_nome: 'Férias', tipo: 'dispendio' },
    { categoria_nome: '13º SALÁRIO', conta_contabil_codigo: '4.2.5', conta_contabil_nome: '13º Salário', tipo: 'dispendio' },
    { categoria_nome: 'HONORÁRIOS', conta_contabil_codigo: '4.3.8', conta_contabil_nome: 'Serviços de Terceiros', tipo: 'dispendio' },
    { categoria_nome: 'SERVIÇOS DE TERCEIROS', conta_contabil_codigo: '4.3.8', conta_contabil_nome: 'Serviços de Terceiros', tipo: 'dispendio' },
    { categoria_nome: 'SERVIÇOS CONTRATADOS PJ', conta_contabil_codigo: '4.3.8', conta_contabil_nome: 'Serviços de Terceiros', tipo: 'dispendio' },
    { categoria_nome: 'SOFTWARE OPERACIONAL', conta_contabil_codigo: '4.3.8', conta_contabil_nome: 'Serviços de Terceiros', tipo: 'dispendio' },
    
    { categoria_nome: 'ALUGUEL DA SEDE', conta_contabil_codigo: '4.3.6', conta_contabil_nome: 'Aluguéis', tipo: 'dispendio' },
    { categoria_nome: 'ALUGUEL', conta_contabil_codigo: '4.3.6', conta_contabil_nome: 'Aluguéis', tipo: 'dispendio' },
    { categoria_nome: 'ENERGIA ELÉTRICA', conta_contabil_codigo: '4.5.1', conta_contabil_nome: 'Luz', tipo: 'dispendio' },
    { categoria_nome: 'LUZ', conta_contabil_codigo: '4.5.1', conta_contabil_nome: 'Luz', tipo: 'dispendio' },
    { categoria_nome: 'ÁGUA E ESGOTO', conta_contabil_codigo: '4.5.2', conta_contabil_nome: 'Água e Esgoto', tipo: 'dispendio' },
    { categoria_nome: 'ÁGUA', conta_contabil_codigo: '4.5.2', conta_contabil_nome: 'Água e Esgoto', tipo: 'dispendio' },
    { categoria_nome: 'TELEFONE', conta_contabil_codigo: '4.5.3', conta_contabil_nome: 'Telefone', tipo: 'dispendio' },
    { categoria_nome: 'INTERNET', conta_contabil_codigo: '4.5.3', conta_contabil_nome: 'Telefone', tipo: 'dispendio' },
    { categoria_nome: 'INTERNET (WI-FI)', conta_contabil_codigo: '4.5.3', conta_contabil_nome: 'Telefone', tipo: 'dispendio' },
    { categoria_nome: 'MATERIAIS DE ESCRITÓRIO', conta_contabil_codigo: '4.5.6', conta_contabil_nome: 'Material de Escritório', tipo: 'dispendio' },
    { categoria_nome: 'ARTIGOS DE GRÁFICA', conta_contabil_codigo: '4.5.6', conta_contabil_nome: 'Material de Escritório', tipo: 'dispendio' },
    { categoria_nome: 'SERVIÇOS DE GRÁFICA', conta_contabil_codigo: '4.5.6', conta_contabil_nome: 'Material de Escritório', tipo: 'dispendio' },
    { categoria_nome: 'TAXAS BANCÁRIAS', conta_contabil_codigo: '4.6.2', conta_contabil_nome: 'Juros Passivos', tipo: 'dispendio' },
    { categoria_nome: 'TARIFAS BANCÁRIAS', conta_contabil_codigo: '4.6.2', conta_contabil_nome: 'Juros Passivos', tipo: 'dispendio' },
    { categoria_nome: 'TRANSPORTE', conta_contabil_codigo: '4.2.10', conta_contabil_nome: 'Transporte de Empregados', tipo: 'dispendio' },
    { categoria_nome: 'COMBUSTÍVEL (PESSOAL EM SERVIÇO)', conta_contabil_codigo: '4.3.1', conta_contabil_nome: 'Combustíveis', tipo: 'dispendio' },
    { categoria_nome: 'ALIMENTAÇÃO (PESSOAL EM SERVIÇO)', conta_contabil_codigo: '4.2.11', conta_contabil_nome: 'Programa de Alimentação do Trabalhador', tipo: 'dispendio' },
    { categoria_nome: 'AUXÍLIOS ESTAGIÁRIO', conta_contabil_codigo: '4.2.2', conta_contabil_nome: 'Ordenados e Salários', tipo: 'dispendio' },
    { categoria_nome: 'INFRAESTRUTURA', conta_contabil_codigo: '4.3.9', conta_contabil_nome: 'Cursos, events e promoções', tipo: 'dispendio' },
    { categoria_nome: 'FÉRIAS REMUNERADAS (ESTAGIÁRIO)', conta_contabil_codigo: '4.2.4', conta_contabil_nome: 'Férias', tipo: 'dispendio' },
    { categoria_nome: 'OUTROS DISPÊNDIOS', conta_contabil_codigo: '4.3.10', conta_contabil_nome: 'Auxílios e doações', tipo: 'dispendio' },
    { categoria_nome: 'ESTAGIÁRIO - FUNDO DE RESERVA (FÉRIAS E 13º AUXÍLIO)', conta_contabil_codigo: '4.2.4', conta_contabil_nome: 'Férias', tipo: 'dispendio' },
  ]

  const staticRecords = mappings.map(m => ({ ...m, tenant_id: tenantId, updated_at: new Date().toISOString() }))
  await sb.from('configuracoes_contabeis').upsert(staticRecords, { onConflict: 'tenant_id,categoria_nome' })

  // 2. Mapeamento Dinâmico para as demais categorias
  const { data: categoriasFinanceiras } = await sb.from('categorias_financeiro').select('categoria, tipo').eq('tenant_id', tenantId)
  if (!categoriasFinanceiras) return { success: true, createdCount: 0 }

  const uniqueCats = Array.from(new Set(categoriasFinanceiras.map((c: any) => JSON.stringify({ n: normalize(c.categoria), t: c.tipo, original: c.categoria }))))
    .map((s: any) => JSON.parse(s))

  // Buscar estado atual dos mapeamentos e do plano
  const { data: currentMaps } = await sb.from('configuracoes_contabeis').select('id, categoria_nome, tipo, conta_contabil_codigo').eq('tenant_id', tenantId)
  const { data: currentPlano } = await sb.from('plano_contas').select('id, codigo, descricao').eq('tenant_id', tenantId).eq('ativa', true)
  
  let processedCount = 0

  for (const cat of uniqueCats) {
    const targetTipo = cat.t === 'receita' ? 'ingresso' : 'dispendio'
    
    // Pular se já mapeado estaticamente (já processado no upsert inicial)
    if (mappings.some(m => normalize(m.categoria_nome) === cat.n)) continue

    const existingMap = currentMaps?.find(m => normalize(m.categoria_nome) === cat.n && m.tipo === targetTipo)
    
    // Verificar se o mapeamento atual é válido (não é grupo 5 e a conta existe no plano novo)
    const isMapValid = existingMap && 
                       !existingMap.conta_contabil_codigo.startsWith('5.') && 
                       currentPlano?.some((p: any) => p.codigo === existingMap.conta_contabil_codigo)

    if (isMapValid) continue

    // Se chegou aqui, precisa de mapeamento/correção
    // A) Tentar encontrar conta com nome idêntico no novo plano
    const matchingAccount = currentPlano?.find((p: any) => normalize(p.descricao) === cat.n)
    
    let finalCodigo = ''
    let finalNome = ''

    if (matchingAccount) {
      finalCodigo = matchingAccount.codigo
      finalNome = matchingAccount.descricao
    } else {
      // B) Criar nova conta dinâmica no grupo 3.5 (Ingressos) ou 4.3 (Despesas Adm)
      const parentCodigo = targetTipo === 'ingresso' ? '3.5' : '4.3'
      
      const lastAccounts = currentPlano
        ?.filter((p: any) => p.codigo.startsWith(parentCodigo + '.'))
        .sort((a: any, b: any) => b.codigo.localeCompare(a.codigo))

      let nextSeq = 101
      if (lastAccounts && lastAccounts.length > 0) {
        const lastPart = lastAccounts[0].codigo.split('.').pop()
        const lastNum = parseInt(lastPart || '0', 10)
        if (!isNaN(lastNum) && lastNum >= 100) nextSeq = lastNum + 1
      }

      finalCodigo = `${parentCodigo}.${String(nextSeq).padStart(3, '0')}`
      finalNome = cat.original

      const { data: pai } = await sb.from('plano_contas').select('id').eq('tenant_id', tenantId).eq('codigo', parentCodigo).single()
      
      const { data: novaConta } = await sb.from('plano_contas').insert({
        tenant_id: tenantId,
        codigo: finalCodigo,
        descricao: finalNome,
        nivel: 3,
        tipo: 'analitica',
        natureza: targetTipo === 'ingresso' ? 'credora' : 'devedora',
        classificacao: targetTipo === 'ingresso' ? 'ingresso' : 'despesa',
        aceita_lancamentos: true,
        ativa: true,
        conta_pai_id: pai?.id || null
      }).select('id, codigo, descricao').single()
      
      if (novaConta) {
        // Atualizar o cache local para o próximo loop não duplicar código
        currentPlano?.push({ id: (novaConta as any).id, codigo: (novaConta as any).codigo, descricao: (novaConta as any).descricao })
      } else {
        // Se falhou ao inserir (talvez código duplicado), tenta buscar se já foi criada agora há pouco
        const { data: retry } = await sb.from('plano_contas').select('id, codigo, descricao').eq('tenant_id', tenantId).eq('codigo', finalCodigo).single()
        if (retry) {
            finalCodigo = retry.codigo
            finalNome = retry.descricao
        }
      }
    }

    // C) Aplicar/Atualizar o mapeamento
    if (finalCodigo) {
      await sb.from('configuracoes_contabeis').upsert({
        tenant_id: tenantId,
        categoria_nome: cat.original,
        conta_contabil_codigo: finalCodigo,
        conta_contabil_nome: finalNome,
        tipo: targetTipo,
        updated_at: new Date().toISOString()
      }, { onConflict: 'tenant_id,categoria_nome' })
      
      processedCount++
    }
  }

  revalidatePath('/configuracoes')
  return { success: true, createdCount: processedCount, error: null }
}
