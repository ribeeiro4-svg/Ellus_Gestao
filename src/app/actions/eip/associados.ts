'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface EIPAssociadosData {
  kpis: {
    totalAtivos: number;
    totalInativos: number;
    ticketMedio: number;
    novosNoPeriodo: number;
  };
  distCategoria: {
    categoria: string;
    quantidade: number;
  }[];
  distHgu: {
    status: string;
    quantidade: number;
  }[];
  crescimentoBase: {
    mesAno: string;
    entradas: number;
  }[];
}

export async function getEIPAssociadosData(
  tenantId: string,
  startDateStr: string,
  endDateStr: string
): Promise<EIPAssociadosData> {
  const cookieStore = cookies()
  const supabase = await createServerSupabase()

  // Buscar todos os associados do tenant
  const { data: associados, error } = await supabase
    .from('associados')
    .select('id, status, categoria, mensalidade, data_ingresso, plano_saude')
    .eq('tenant_id', tenantId)

  if (error) throw new Error(error.message)

  const startDate = new Date(startDateStr)
  const endDate = new Date(endDateStr)

  let totalAtivos = 0
  let totalInativos = 0
  let somaMensalidade = 0
  let novosNoPeriodo = 0

  const catMap: Record<string, number> = {}
  const hguMap: Record<string, number> = {
    'Ativo': 0,
    'Aguardando Declaração': 0,
    'Não Possui': 0
  }
  const crescMap: Record<string, number> = {}

  associados?.forEach(row => {
    // KPIs Básicos
    if (['ativo', 'inadimplente', 'suspenso'].includes(row.status)) {
      totalAtivos++
      somaMensalidade += Number(row.mensalidade || 0)
    } else {
      totalInativos++
    }

    // Novos no período
    if (row.data_ingresso) {
      const dIngresso = new Date(row.data_ingresso)
      if (dIngresso >= startDate && dIngresso <= endDate) {
        novosNoPeriodo++
      }

      // Crescimento (agrupado por YYYY-MM)
      const mesAno = dIngresso.toISOString().substring(0, 7) // "2023-10"
      crescMap[mesAno] = (crescMap[mesAno] || 0) + 1
    }

    // Distribuição por Categoria
    const cat = row.categoria || 'Sem Categoria'
    if (row.status !== 'desligado') {
      catMap[cat] = (catMap[cat] || 0) + 1
    }

    // Distribuição Plano de Saúde (Apenas ativos)
    if (row.status !== 'desligado') {
      const plano = row.plano_saude || 'Não Possui'
      if (hguMap[plano] !== undefined) {
        hguMap[plano]++
      } else {
        hguMap['Outros'] = (hguMap['Outros'] || 0) + 1
      }
    }
  })

  const ticketMedio = totalAtivos > 0 ? somaMensalidade / totalAtivos : 0

  const distCategoria = Object.keys(catMap)
    .map(k => ({ categoria: k, quantidade: catMap[k] }))
    .sort((a, b) => b.quantidade - a.quantidade)

  const distHgu = Object.keys(hguMap)
    .map(k => ({ status: k, quantidade: hguMap[k] }))
    .sort((a, b) => b.quantidade - a.quantidade)

  // Pegar os últimos 6 meses de entradas para o gráfico
  const crescimentoBase = Object.keys(crescMap)
    .sort() // cronológico
    .slice(-6) // Pega apenas os 6 meses mais recentes com entradas
    .map(k => ({
      mesAno: k, // Podemos formatar no frontend
      entradas: crescMap[k]
    }))

  return {
    kpis: {
      totalAtivos,
      totalInativos,
      ticketMedio,
      novosNoPeriodo
    },
    distCategoria,
    distHgu,
    crescimentoBase
  }
}
