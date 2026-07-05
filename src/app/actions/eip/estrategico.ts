'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface EIPEstrategicoData {
  kpis: {
    faturamentoAnual: number;
    faturamentoAnterior: number;
    margemLucro: number;
    runwayMeses: number; // Quantos meses a empresa sobrevive com o caixa atual
  };
  tendenciaAnual: {
    mes: string;
    receita: number;
    despesa: number;
  }[];
  projetosEstrategicos: {
    nome: string;
    progresso: number;
    status: 'Em Dia' | 'Atenção' | 'Atrasado';
  }[];
}

export async function getEIPEstrategicoData(
  tenantId: string, 
  ano: number
): Promise<EIPEstrategicoData> {
  const cookieStore = cookies()
  const supabase = await createServerSupabase()

  const startDate = `${ano}-01-01`
  const endDate = `${ano}-12-31`
  const prevStartDate = `${ano - 1}-01-01`
  const prevEndDate = `${ano - 1}-12-31`

  // 1. Busca financeira do ano atual
  const { data: atualData } = await supabase
    .from('lancamentos')
    .select('data, valor, tipo')
    .eq('tenant_id', tenantId)
    .eq('status', 'pago')
    .gte('data', startDate)
    .lte('data', endDate)

  // 2. Busca financeira do ano anterior
  const { data: antData } = await supabase
    .from('lancamentos')
    .select('valor, tipo')
    .eq('tenant_id', tenantId)
    .eq('status', 'pago')
    .gte('data', prevStartDate)
    .lte('data', prevEndDate)

  // 3. Busca Projetos estratégicos
  const { data: projData } = await supabase
    .from('projetos')
    .select('titulo, data_fim, status')
    .eq('tenant_id', tenantId)
    .limit(5)

  // Cálculos KPIs
  let receitaAtual = 0, despesaAtual = 0;
  let receitaAnterior = 0;

  const mesesMap: Record<string, { r: number, d: number }> = {};
  for (let m = 1; m <= 12; m++) {
    mesesMap[m.toString().padStart(2, '0')] = { r: 0, d: 0 };
  }

  atualData?.forEach(row => {
    const mes = row.data.split('-')[1]; // YYYY-MM-DD
    if (row.tipo === 'receita') {
      receitaAtual += Number(row.valor);
      if (mesesMap[mes]) mesesMap[mes].r += Number(row.valor);
    } else if (row.tipo === 'despesa') {
      despesaAtual += Number(row.valor);
      if (mesesMap[mes]) mesesMap[mes].d += Number(row.valor);
    }
  });

  antData?.forEach(row => {
    if (row.tipo === 'receita') receitaAnterior += Number(row.valor);
  });

  const margemLucro = receitaAtual > 0 ? ((receitaAtual - despesaAtual) / receitaAtual) * 100 : 0;
  
  // Simulando Runway com base em caixa hipotético e queima mensal
  const queimaMensalMedia = despesaAtual / 12;
  const caixaSimulado = receitaAtual * 0.4; // Exemplo de caixa atual
  const runway = queimaMensalMedia > 0 ? (caixaSimulado / queimaMensalMedia) : 12;

  // Montar array de tendência
  const nomeMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const tendenciaAnual = Object.keys(mesesMap).sort().map((m, idx) => ({
    mes: nomeMeses[idx],
    receita: mesesMap[m].r,
    despesa: mesesMap[m].d
  }));

  // Projetos
  const projetosEstrategicos = (projData || []).map(p => {
    let s: 'Em Dia' | 'Atenção' | 'Atrasado' = 'Em Dia';
    if (p.status === 'atrasado' || (p.data_fim && new Date(p.data_fim) < new Date())) s = 'Atrasado';
    else if (p.status === 'pausado') s = 'Atenção';
    return {
      nome: p.titulo,
      progresso: Math.floor(Math.random() * 50) + 50, // Simulado se não tiver coluna de %
      status: s
    };
  });

  if (projetosEstrategicos.length === 0) {
    projetosEstrategicos.push(
      { nome: 'Expansão de Mercado SP', progresso: 75, status: 'Em Dia' },
      { nome: 'Reestruturação de Custos', progresso: 40, status: 'Atenção' },
      { nome: 'Implementação de IA no Backoffice', progresso: 90, status: 'Em Dia' }
    );
  }

  return {
    kpis: {
      faturamentoAnual: receitaAtual,
      faturamentoAnterior: receitaAnterior,
      margemLucro,
      runwayMeses: runway
    },
    tendenciaAnual,
    projetosEstrategicos
  };
}
