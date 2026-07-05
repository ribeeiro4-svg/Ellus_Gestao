'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface EIPMetasData {
  kpis: {
    totalMetas: number;
    metasAtingidas: number;
    emAndamento: number;
    naoIniciadas: number;
  };
  progressoPorDepartamento: {
    departamento: string;
    atingimento_percentual: number;
  }[];
  metasTop: {
    nome: string;
    responsavel: string;
    progresso: number;
    status: string;
  }[];
}

export async function getEIPMetasData(tenantId: string): Promise<EIPMetasData> {
  const cookieStore = cookies()
  const supabase = await createServerSupabase()

  const { data: metas, error } = await supabase
    .from('metas')
    .select('meta, responsavel, prazo, valor_meta, valor_realizado, status')
    .eq('tenant_id', tenantId)

  if (error) {
    console.error("Metas Error:", error)
    // Se a tabela não existir, retorna vazio gracefully
    return {
      kpis: { totalMetas: 0, metasAtingidas: 0, emAndamento: 0, naoIniciadas: 0 },
      progressoPorDepartamento: [],
      metasTop: []
    }
  }

  let totalMetas = 0
  let metasAtingidas = 0
  let emAndamento = 0
  let naoIniciadas = 0

  const metasTop: EIPMetasData['metasTop'] = []

  // Simular departamentos com base no responsável para fins de gráfico
  const depMap: Record<string, { realizado: number, meta: number }> = {}

  metas?.forEach(row => {
    totalMetas++
    if (row.status === 'atingida') metasAtingidas++
    else if (row.status === 'em_andamento') emAndamento++
    else naoIniciadas++

    const progresso = row.valor_meta > 0 ? (row.valor_realizado / row.valor_meta) * 100 : 0

    metasTop.push({
      nome: row.meta,
      responsavel: row.responsavel || 'Equipe',
      progresso,
      status: row.status
    })

    const dep = row.responsavel ? row.responsavel.split(' ')[0] : 'Geral'
    if (!depMap[dep]) depMap[dep] = { realizado: 0, meta: 0 }
    depMap[dep].realizado += Number(row.valor_realizado)
    depMap[dep].meta += Number(row.valor_meta)
  })

  const progressoPorDepartamento = Object.keys(depMap).map(k => {
    const meta = depMap[k].meta
    const pct = meta > 0 ? (depMap[k].realizado / meta) * 100 : 0
    return {
      departamento: k,
      atingimento_percentual: Math.min(pct, 100)
    }
  }).sort((a, b) => b.atingimento_percentual - a.atingimento_percentual).slice(0, 5)

  return {
    kpis: {
      totalMetas,
      metasAtingidas,
      emAndamento,
      naoIniciadas
    },
    progressoPorDepartamento,
    metasTop: metasTop.sort((a, b) => b.progresso - a.progresso).slice(0, 10)
  }
}
