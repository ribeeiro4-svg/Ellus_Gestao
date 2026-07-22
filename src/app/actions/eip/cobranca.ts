'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface EIPCobrancaData {
  kpis: {
    totalAtrasado: number;
    qtdeAtrasados: number;
    maiorAtraso: number;
  };
  faixasAtraso: {
    faixa: string;
    valor: number;
    quantidade: number;
  }[];
  topDevedores: {
    descricao: string;
    valor: number;
    diasAtraso: number;
  }[];
}

export async function getEIPCobrancaData(tenantId: string): Promise<EIPCobrancaData> {
  const cookieStore = cookies()
  const supabase = await createServerSupabase()

  // Buscar todos os lançamentos atrasados (receitas não pagas)
  const { data: atrasadosData, error } = await supabase
    .from('lancamentos')
    .select('id, data, valor, descricao')
    .eq('tenant_id', tenantId)
    .eq('tipo', 'receita')
    .eq('status', 'atrasado')

  if (error) throw new Error(error.message)

  const hoje = new Date()
  let totalAtrasado = 0
  let qtdeAtrasados = 0
  let maiorAtraso = 0

  const faixasMap = {
    '0 a 30 dias': { valor: 0, quantidade: 0 },
    '31 a 60 dias': { valor: 0, quantidade: 0 },
    '61 a 90 dias': { valor: 0, quantidade: 0 },
    'Mais de 90 dias': { valor: 0, quantidade: 0 }
  }

  const devedoresMap: Record<string, { valor: number, maxDiasAtraso: number }> = {}

  atrasadosData?.forEach(row => {
    const valor = Number(row.valor)
    totalAtrasado += valor
    qtdeAtrasados += 1
    if (valor > maiorAtraso) maiorAtraso = valor

    const dataVenc = new Date(row.data)
    const diffTime = Math.abs(hoje.getTime() - dataVenc.getTime())
    const diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // Faixas
    if (diasAtraso <= 30) {
      faixasMap['0 a 30 dias'].valor += valor
      faixasMap['0 a 30 dias'].quantidade += 1
    } else if (diasAtraso <= 60) {
      faixasMap['31 a 60 dias'].valor += valor
      faixasMap['31 a 60 dias'].quantidade += 1
    } else if (diasAtraso <= 90) {
      faixasMap['61 a 90 dias'].valor += valor
      faixasMap['61 a 90 dias'].quantidade += 1
    } else {
      faixasMap['Mais de 90 dias'].valor += valor
      faixasMap['Mais de 90 dias'].quantidade += 1
    }

    // Devedores (agrupando por descrição para simular nome do cliente/associado)
    const desc = row.descricao || 'Desconhecido'
    if (!devedoresMap[desc]) {
      devedoresMap[desc] = { valor: 0, maxDiasAtraso: 0 }
    }
    devedoresMap[desc].valor += valor
    if (diasAtraso > devedoresMap[desc].maxDiasAtraso) {
      devedoresMap[desc].maxDiasAtraso = diasAtraso
    }
  })

  const faixasAtraso = Object.keys(faixasMap).map(k => ({
    faixa: k,
    valor: faixasMap[k as keyof typeof faixasMap].valor,
    quantidade: faixasMap[k as keyof typeof faixasMap].quantidade
  }))

  const topDevedores = Object.keys(devedoresMap).map(k => ({
    descricao: k,
    valor: devedoresMap[k].valor,
    diasAtraso: devedoresMap[k].maxDiasAtraso
  })).sort((a, b) => b.valor - a.valor).slice(0, 10) // Top 10

  return {
    kpis: {
      totalAtrasado,
      qtdeAtrasados,
      maiorAtraso
    },
    faixasAtraso,
    topDevedores
  }
}
