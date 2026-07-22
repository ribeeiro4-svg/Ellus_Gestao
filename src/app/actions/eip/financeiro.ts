'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Interface de retorno
export interface EIPFinanceiroData {
  kpis: {
    receitaAtual: number;
    despesaAtual: number;
    resultadoAtual: number;
    receitaAnterior: number;
    despesaAnterior: number;
    resultadoAnterior: number;
  };
  fluxoCaixa: {
    data_ref: string;
    total_receita: number;
    total_despesa: number;
    saldo_dia: number;
  }[];
  receitasPorCategoria: {
    nome_categoria: string;
    total_faturado: number;
  }[];
  despesasPorFornecedor: {
    fornecedor: string;
    total_gasto: number;
  }[];
  receitasPorConvenio: {
    convenio: string;
    total_faturado: number;
  }[];
  dre: {
    linha: string;
    valor: number;
    tipo: 'receita' | 'deducao' | 'custo' | 'despesa' | 'resultado';
    destaque?: boolean;
  }[];
}

export async function getEIPFinanceiroData(
  tenantId: string, 
  startDateStr: string, 
  endDateStr: string
): Promise<EIPFinanceiroData> {
  const cookieStore = cookies()
  const supabase = await createServerSupabase()

  const startDate = new Date(startDateStr)
  const endDate = new Date(endDateStr)

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  const prevEndDate = new Date(startDate)
  prevEndDate.setDate(prevEndDate.getDate() - 1)
  
  const prevStartDate = new Date(prevEndDate)
  prevStartDate.setDate(prevStartDate.getDate() - diffDays)

  // Buscar todos os lançamentos do período atual
  const { data: atualData, error: atualError } = await supabase
    .from('lancamentos')
    .select('data, valor, tipo, categoria, descricao')
    .eq('tenant_id', tenantId)
    .eq('status', 'pago')
    .gte('data', startDate.toISOString().split('T')[0])
    .lte('data', endDate.toISOString().split('T')[0])

  if (atualError) throw new Error(atualError.message)

  // Buscar lançamentos do período anterior (para os KPIs de comparativo)
  const { data: antData, error: antError } = await supabase
    .from('lancamentos')
    .select('valor, tipo')
    .eq('tenant_id', tenantId)
    .eq('status', 'pago')
    .gte('data', prevStartDate.toISOString().split('T')[0])
    .lte('data', prevEndDate.toISOString().split('T')[0])

  if (antError) throw new Error(antError.message)

  // === AGREGAÇÕES (Em memória no Server) ===

  // 1. KPIs
  let receitaAtual = 0, despesaAtual = 0;
  let receitaAnterior = 0, despesaAnterior = 0;

  atualData?.forEach(row => {
    if (row.tipo === 'receita') receitaAtual += Number(row.valor);
    if (row.tipo === 'despesa') despesaAtual += Number(row.valor);
  });

  antData?.forEach(row => {
    if (row.tipo === 'receita') receitaAnterior += Number(row.valor);
    if (row.tipo === 'despesa') despesaAnterior += Number(row.valor);
  });

  // 2. Receitas por Categoria
  const catMap: Record<string, number> = {};
  atualData?.forEach(row => {
    if (row.tipo === 'receita') {
      catMap[row.categoria] = (catMap[row.categoria] || 0) + Number(row.valor);
    }
  });

  const receitasPorCategoria = Object.keys(catMap).map(k => ({
    nome_categoria: k,
    total_faturado: catMap[k]
  })).sort((a, b) => b.total_faturado - a.total_faturado);

  // 3. Fluxo de Caixa (Agrupado por Dia)
  const fluxoMap: Record<string, { r: number, d: number }> = {};
  
  // Preencher todos os dias no range com 0
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dStr = d.toISOString().split('T')[0];
    fluxoMap[dStr] = { r: 0, d: 0 };
  }

  atualData?.forEach(row => {
    const dStr = row.data;
    if (fluxoMap[dStr]) {
      if (row.tipo === 'receita') fluxoMap[dStr].r += Number(row.valor);
      if (row.tipo === 'despesa') fluxoMap[dStr].d += Number(row.valor);
    }
  });

  const fluxoCaixa = Object.keys(fluxoMap).sort().map(dStr => {
    const r = fluxoMap[dStr].r;
    const d = fluxoMap[dStr].d;
    return {
      data_ref: dStr,
      total_receita: r,
      total_despesa: d,
      saldo_dia: r - d
    };
  });

  // 4. Despesas por Fornecedor (Simulado via primeira palavra da descrição)
  const fornMap: Record<string, number> = {};
  atualData?.forEach(row => {
    if (row.tipo === 'despesa') {
      const desc = row.descricao ? row.descricao.split(' ')[0] : 'Diversos';
      fornMap[desc] = (fornMap[desc] || 0) + Number(row.valor);
    }
  });
  const despesasPorFornecedor = Object.keys(fornMap)
    .map(k => ({ fornecedor: k, total_gasto: fornMap[k] }))
    .sort((a, b) => b.total_gasto - a.total_gasto)
    .slice(0, 7); // Top 7

  // 5. Receitas por Convênio (Simulado via Categoria/Descrição)
  const convMap: Record<string, number> = {};
  atualData?.forEach(row => {
    if (row.tipo === 'receita') {
      let conv = row.categoria || 'Particular';
      // Se a categoria for muito genérica, tenta ver a descrição
      if (['Outros', 'Receitas', 'Mensalidade'].includes(conv) && row.descricao) {
        if (row.descricao.toLowerCase().includes('unimed')) conv = 'Unimed';
        else if (row.descricao.toLowerCase().includes('bradesco')) conv = 'Bradesco Saúde';
        else if (row.descricao.toLowerCase().includes('amil')) conv = 'Amil';
      }
      convMap[conv] = (convMap[conv] || 0) + Number(row.valor);
    }
  });
  const receitasPorConvenio = Object.keys(convMap)
    .map(k => ({ convenio: k, total_faturado: convMap[k] }))
    .sort((a, b) => b.total_faturado - a.total_faturado)
    .slice(0, 5); // Top 5

  // 6. DRE Gerencial Simplificado
  let deducoes = 0;
  let custos = 0;
  let despesasFixas = 0;

  atualData?.forEach(row => {
    if (row.tipo === 'despesa') {
      const cat = (row.categoria || '').toLowerCase();
      if (cat.includes('imposto') || cat.includes('taxa')) {
        deducoes += Number(row.valor);
      } else if (cat.includes('comissão') || cat.includes('repasse') || cat.includes('material')) {
        custos += Number(row.valor);
      } else {
        despesasFixas += Number(row.valor);
      }
    }
  });

  const receitaBruta = receitaAtual;
  const receitaLiquida = receitaBruta - deducoes;
  const margemContribuicao = receitaLiquida - custos;
  const resultadoLiquido = margemContribuicao - despesasFixas;

  const dre = [
    { linha: 'Receita Operacional Bruta', valor: receitaBruta, tipo: 'receita', destaque: true },
    { linha: '(-) Deduções e Impostos', valor: deducoes, tipo: 'deducao' },
    { linha: '= Receita Operacional Líquida', valor: receitaLiquida, tipo: 'resultado', destaque: true },
    { linha: '(-) Custos Variáveis / Diretos', valor: custos, tipo: 'custo' },
    { linha: '= Margem de Contribuição', valor: margemContribuicao, tipo: 'resultado', destaque: true },
    { linha: '(-) Despesas Fixas / Operacionais', valor: despesasFixas, tipo: 'despesa' },
    { linha: '= Resultado Líquido (EBITDA)', valor: resultadoLiquido, tipo: 'resultado', destaque: true },
  ] as EIPFinanceiroData['dre'];

  return {
    kpis: {
      receitaAtual,
      despesaAtual,
      resultadoAtual: receitaAtual - despesaAtual,
      receitaAnterior,
      despesaAnterior,
      resultadoAnterior: receitaAnterior - despesaAnterior
    },
    fluxoCaixa,
    receitasPorCategoria,
    despesasPorFornecedor,
    receitasPorConvenio,
    dre
  }
}
