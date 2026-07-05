'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface EIPOperacionalData {
  kpis: {
    totalProjetos: number;
    concluidos: number;
    emAndamento: number;
    atrasados: number;
  };
  projetosPorResponsavel: {
    responsavel: string;
    quantidade: number;
  }[];
  projetosStatus: {
    status: string;
    quantidade: number;
  }[];
}

export async function getEIPOperacionalData(tenantId: string): Promise<EIPOperacionalData> {
  const cookieStore = cookies()
  const supabase = await createServerSupabase()

  const { data: projetos, error } = await supabase
    .from('projetos')
    .select('projeto, responsavel, prazo, status')
    .eq('tenant_id', tenantId)

  if (error) {
    console.error("Operacional Error:", error)
    return {
      kpis: { totalProjetos: 0, concluidos: 0, emAndamento: 0, atrasados: 0 },
      projetosPorResponsavel: [],
      projetosStatus: []
    }
  }

  let totalProjetos = 0
  let concluidos = 0
  let emAndamento = 0
  let atrasados = 0

  const respMap: Record<string, number> = {}
  const statusMap: Record<string, number> = {}
  const hoje = new Date()

  projetos?.forEach(row => {
    totalProjetos++
    const prazo = row.prazo ? new Date(row.prazo) : null
    let atualStatus = row.status || 'Não Iniciado'

    // Verifica se está atrasado (em andamento mas passou do prazo)
    if (atualStatus.toLowerCase() !== 'concluido' && atualStatus.toLowerCase() !== 'concluído' && prazo && prazo < hoje) {
      atualStatus = 'Atrasado'
      atrasados++
    } else if (atualStatus.toLowerCase() === 'concluido' || atualStatus.toLowerCase() === 'concluído') {
      concluidos++
    } else {
      emAndamento++
    }

    statusMap[atualStatus] = (statusMap[atualStatus] || 0) + 1

    const resp = row.responsavel || 'Sem Responsável'
    respMap[resp] = (respMap[resp] || 0) + 1
  })

  const projetosPorResponsavel = Object.keys(respMap).map(k => ({
    responsavel: k,
    quantidade: respMap[k]
  })).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5)

  const projetosStatus = Object.keys(statusMap).map(k => ({
    status: k,
    quantidade: statusMap[k]
  })).sort((a, b) => b.quantidade - a.quantidade)

  return {
    kpis: {
      totalProjetos,
      concluidos,
      emAndamento,
      atrasados
    },
    projetosPorResponsavel,
    projetosStatus
  }
}
