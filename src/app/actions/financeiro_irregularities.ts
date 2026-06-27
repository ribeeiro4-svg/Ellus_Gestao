'use server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function normalizar(str: string): string {
  return (str || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2010-\u2015]/g, '-') // Normaliza vários tipos de traços/hifens
    .toLowerCase()
}

/**
 * Rastreia irregularidades:
 * Se um associado tem "ADESÃO" no mês, não pode ter "MENSALIDADE" no mesmo mês.
 */
export async function trackIrregularitiesAction() {
  const sb = await createServerSupabase()
  const sbAdmin = createAdminSupabase()

  // 1. Buscar todos os lançamentos de receita
  let lancamentos: any[] = []
  let from = 0
  let to = 999
  let keepFetching = true

  while (keepFetching) {
    const { data, error } = await sb
      .from('lancamentos')
      .select('id, associado_id, data, competencia_mes, competencia_ano, status, descricao, categoria, valor, banco_transacao_id, conciliado, associados ( nome ), tenant_id')
      .eq('tipo', 'receita')
      .range(from, to)

    if (error) return { error: error.message }
    
    if (data && data.length > 0) {
      lancamentos = [...lancamentos, ...data]
      if (data.length < 1000) keepFetching = false
      else { from += 1000; to += 1000 }
    } else keepFetching = false
  }

  // 2. Buscar vínculos contábeis
  const { data: integrated } = await sbAdmin
    .from('lancamentos_contabeis')
    .select('origem_id')
    .eq('origem_tipo', 'financeiro')
  
  const integratedIds = new Set((integrated || []).map(i => i.origem_id))

  // 3. Agrupar por Associado (Usando nome normalizado para capturar duplicidades de ID)
  const assocGroups: Record<string, any[]> = {}
  lancamentos.forEach(l => {
    let nomeOriginal = l.associados?.nome || '';
    
    // Fallback: Tentar extrair nome da descrição se não houver vínculo
    if (!nomeOriginal && l.descricao) {
      let extracted = '';
      if (l.descricao.includes(' - ')) extracted = l.descricao.split(' - ')[1];
      else if (l.descricao.includes(' – ')) extracted = l.descricao.split(' – ')[1];
      else if (l.descricao.includes(' — ')) extracted = l.descricao.split(' — ')[1];
      
      if (extracted) {
        // Remove qualquer coisa em colchetes ou parênteses (ex: [ENCONTRO DE CONTAS])
        nomeOriginal = extracted.split('[')[0].split('(')[0].trim();
      }
    }

    if (!nomeOriginal) return;
    const key = normalizar(nomeOriginal);
    if (!assocGroups[key]) assocGroups[key] = []
    assocGroups[key].push(l)
  })

  const logs: { status: 'MANTIDO' | 'EXCLUÍDO', associado: string, descricao: string, motivo?: string }[] = []
  const idsToDelete: string[] = []
  let countDeleted = 0
  let countSkipped = 0

  // 4. Analisar cada associado
  Object.entries(assocGroups).forEach(([assocId, group]) => {
    const adesaoList: any[] = []
    const adesaoMonths = new Set<string>()
    
    // Identificar registros de adesão
    group.forEach(l => {
      const descNorm = normalizar(l.descricao)
      const catNorm = normalizar(l.categoria)
      if (descNorm.includes('adesao') || catNorm.includes('adesao')) {
        adesaoList.push(l)
        
        // Pega o mês da data
        const d = new Date(l.data)
        adesaoMonths.add(`${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`)
        
        // Pega o mês da competência se existir
        if (l.competencia_ano && l.competencia_mes !== undefined && l.competencia_mes !== null) {
          adesaoMonths.add(`${l.competencia_ano}-${(l.competencia_mes + 1).toString().padStart(2, '0')}`)
        }
      }
    })

    // REGRA 0: Se houver múltiplas ADESÕES para o mesmo associado
    if (adesaoList.length > 1) {
      const sortedAdesoes = [...adesaoList].sort((a, b) => {
        const score = (x: any) => {
          let s = 0
          if (x.banco_transacao_id || x.conciliado) s += 100
          if (integratedIds.has(x.id)) s += 50
          if (x.status === 'pago') s += 10
          return s
        }
        return score(b) - score(a)
      })

      const keepAdesao = sortedAdesoes[0]
      sortedAdesoes.slice(1).forEach(m => {
        if (isProtected(m, integratedIds)) {
          logs.push({ status: 'MANTIDO', associado: m.associados?.nome || 'Assoc', descricao: m.descricao, motivo: 'Adesão duplicada protegida (OFX/Contab)' })
          countSkipped++
        } else {
          if (!idsToDelete.includes(m.id)) {
            idsToDelete.push(m.id)
            logs.push({ status: 'EXCLUÍDO', associado: m.associados?.nome || 'Assoc', descricao: m.descricao, motivo: 'Adesão Duplicada' })
            countDeleted++
          }
        }
      })
    }

    // Procurar mensalidades nos mesmos meses da Adesão OU duplicatas de mensalidades
    const mensalidadesPorMes: Record<string, any[]> = {}
    group.forEach(l => {
      const descNorm = normalizar(l.descricao)
      const catNorm = normalizar(l.categoria)
      if (descNorm.includes('mensalidade') || catNorm.includes('mensalidade')) {
        const d = new Date(l.data)
        const m = `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`
        if (!mensalidadesPorMes[m]) mensalidadesPorMes[m] = []
        mensalidadesPorMes[m].push(l)
        
        // Também agrupa por competência se diferente
        if (l.competencia_ano && l.competencia_mes !== undefined && l.competencia_mes !== null) {
          const mc = `${l.competencia_ano}-${(l.competencia_mes + 1).toString().padStart(2, '0')}`
          if (mc !== m) {
            if (!mensalidadesPorMes[mc]) mensalidadesPorMes[mc] = []
            mensalidadesPorMes[mc].push(l)
          }
        }
      }
    })

    // Analisar cada mês de mensalidade
    Object.entries(mensalidadesPorMes).forEach(([month, mList]) => {
      const isAdesaoMonth = adesaoMonths.has(month)
      
      if (isAdesaoMonth) {
        // REGRA 1: Mensalidade no mês da Adesão -> TUDO vira irregular
        mList.forEach(m => {
          if (isProtected(m, integratedIds)) {
            logs.push({ status: 'MANTIDO', associado: m.associados?.nome || 'Assoc', descricao: m.descricao, motivo: 'Protegido (OFX/Contab/EC) no mês da Adesão' })
            countSkipped++
          } else {
            if (!idsToDelete.includes(m.id)) {
              idsToDelete.push(m.id)
              logs.push({ status: 'EXCLUÍDO', associado: m.associados?.nome || 'Assoc', descricao: m.descricao, motivo: 'Mensalidade no mesmo mês da Adesão' })
              countDeleted++
            }
          }
        })
      } else if (mList.length > 1) {
        // REGRA 2: Duplicatas de Mensalidade no mesmo mês
        // Ordenar: Prioridade de MANUTENÇÃO (OFX > Pago > Atrasado)
        const sorted = [...mList].sort((a, b) => {
          const score = (x: any) => {
            let s = 0
            if (x.banco_transacao_id || x.conciliado) s += 100
            if (integratedIds.has(x.id)) s += 50
            if (x.status === 'pago') s += 10
            return s
          }
          return score(b) - score(a)
        })

        const keep = sorted[0]
        sorted.slice(1).forEach(m => {
          if (isProtected(m, integratedIds)) {
             // Se o duplicado também é protegido, mantemos (não podemos excluir OFX duplicado automaticamente sem critério humano)
             logs.push({ status: 'MANTIDO', associado: m.associados?.nome || 'Assoc', descricao: m.descricao, motivo: 'Duplicata protegida (Manual/OFX)' })
             countSkipped++
          } else {
            if (!idsToDelete.includes(m.id)) {
              idsToDelete.push(m.id)
              logs.push({ status: 'EXCLUÍDO', associado: m.associados?.nome || 'Assoc', descricao: m.descricao, motivo: `Duplicata de Mensalidade em ${month}` })
              countDeleted++
            }
          }
        })
      }
    })
  })

  // Helper para proteção
  function isProtected(l: any, integratedIds: Set<string>) {
    const isEC = (l.descricao || '').includes('[ENCONTRO DE CONTAS]')
    const isOFX = l.banco_transacao_id != null || l.conciliado === true
    const isIntegrated = integratedIds.has(l.id)
    return isEC || isOFX || isIntegrated
  }

  // 5. Executar exclusões
  if (idsToDelete.length > 0) {
    const chunkSize = 50
    for (let i = 0; i < idsToDelete.length; i += chunkSize) {
      await sbAdmin.from('lancamentos').delete().in('id', idsToDelete.slice(i, i + chunkSize))
    }
  }

  // 6. Registrar log
  try {
    const { registrarLogFinanceiroAction } = await import('@/features/financeiro/actions/logActions')
    const logSummary = logs.map(l => `${l.status}: ${l.associado} | ${l.descricao} | ${l.motivo || ''}`).join('\n')
    await registrarLogFinanceiroAction(
      'RASTREIO_IRREGULARIDADES',
      `Rastreio executado. ${countDeleted} removidos, ${countSkipped} protegidos.\n\n${logSummary}`
    )
  } catch (err) {}

  return {
    success: true,
    countDeleted,
    countSkipped,
    logs,
    message: `Rastreio concluído! ${countDeleted} mensalidades removidas e ${countSkipped} registros protegidos.`
  }
}

export async function auditRecorrenciaFaltantesAction(tenantId: string, mesTarget: number, anoTarget: number) {
  const { createServerSupabase } = await import('@/lib/supabase/server')
  const sbAdmin = await createServerSupabase()
  if (!tenantId) return { error: 'Tenant ID não fornecido' }

  try {
    // 1. Buscar todos os associados ativos que possuem recorrência ativada
    const { data: associadosAtivos, error: errAssoc } = await sbAdmin
      .from('associados')
      .select('id, nome, recorrencia_ativa')
      .eq('tenant_id', tenantId)
      .eq('status', 'Ativo')
      .eq('recorrencia_ativa', true)

    if (errAssoc) throw errAssoc

    // 2. Buscar todas as receitas com categoria/descrição de mensalidade no ano alvo
    const { data: lancamentos, error: errLanc } = await sbAdmin
      .from('lancamentos')
      .select('id, associado_id, data, competencia_mes, competencia_ano, categoria, descricao, status')
      .eq('tenant_id', tenantId)
      .eq('tipo', 'receita')
      .not('status', 'eq', 'cancelado') // ignorar cancelados
      .or('categoria.ilike.%Mensalidade%,descricao.ilike.%Mensalidade%')
      
    if (errLanc) throw errLanc

    const logs: any[] = []
    const monthStr = `${anoTarget}-${(mesTarget + 1).toString().padStart(2, '0')}`

    // 3. Verificar quem ficou de fora
    for (const assoc of (associadosAtivos || [])) {
      const lancamentosAssoc = (lancamentos || []).filter((l: any) => l.associado_id === assoc.id)
      
      let encontrou = false
      for (const l of lancamentosAssoc) {
        // Verifica se é a competência exata pedida, ou se a data (caixa) caiu no mês se não tiver competência
        const lMes = l.competencia_mes !== null && l.competencia_mes !== undefined 
          ? l.competencia_mes 
          : new Date(l.data).getUTCMonth()
          
        const lAno = l.competencia_ano !== null && l.competencia_ano !== undefined 
          ? l.competencia_ano 
          : new Date(l.data).getUTCFullYear()

        if (lMes === mesTarget && lAno === anoTarget) {
          encontrou = true
          break
        }
      }

      if (!encontrou) {
        logs.push({
          status: 'erro',
          associado: assoc.nome,
          descricao: 'Mensalidade Faltante',
          mensagem: `Nenhum lançamento encontrado para ${monthStr}`
        })
      }
    }

    return { success: true, logs }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
