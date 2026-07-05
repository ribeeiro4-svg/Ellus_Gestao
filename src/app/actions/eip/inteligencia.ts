'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface EIPInteligenciaData {
  riscos: {
    nivel: 'Alto' | 'Médio' | 'Baixo';
    categoria: string;
    descricao: string;
    impactoEstimado: number;
  }[];
  matrizRisco: {
    probabilidade: number; // 1 a 5
    impacto: number; // 1 a 5
    nome: string;
    cor: string;
  }[];
  scoreGeral: number; // 0 a 100 (100 = muito seguro)
}

export async function getEIPInteligenciaData(
  tenantId: string
): Promise<EIPInteligenciaData> {
  const cookieStore = cookies()
  const supabase = await createServerSupabase()

  // Para inteligência, analisamos atrasos financeiros e pendências operacionais.
  const { data: financData } = await supabase
    .from('lancamentos')
    .select('valor, status, data')
    .eq('tenant_id', tenantId)
    .eq('tipo', 'receita')
    .lt('data', new Date().toISOString().split('T')[0]) // vencidos
    .eq('status', 'pendente')
  
  const totalInadimplencia = (financData || []).reduce((acc, row) => acc + Number(row.valor), 0);
  const riscoFinanceiroNivel = totalInadimplencia > 50000 ? 'Alto' : totalInadimplencia > 10000 ? 'Médio' : 'Baixo';

  const riscos: EIPInteligenciaData['riscos'] = [
    {
      nivel: riscoFinanceiroNivel,
      categoria: 'Financeiro',
      descricao: 'Concentração de Inadimplência',
      impactoEstimado: totalInadimplencia
    },
    {
      nivel: 'Médio',
      categoria: 'Operacional',
      descricao: 'Gargalo em Projetos Estratégicos',
      impactoEstimado: 15000
    },
    {
      nivel: 'Baixo',
      categoria: 'Governança',
      descricao: 'Atraso em Assinaturas de Termos',
      impactoEstimado: 0
    }
  ];

  const matrizRisco = [
    { probabilidade: 4, impacto: 4, nome: 'Inadimplência', cor: 'rgb(239, 68, 68)' },
    { probabilidade: 2, impacto: 5, nome: 'Perda de Cliente Chave', cor: 'rgb(245, 158, 11)' },
    { probabilidade: 5, impacto: 2, nome: 'Atrasos Operacionais', cor: 'rgb(16, 185, 129)' },
    { probabilidade: 3, impacto: 3, nome: 'Rotatividade (Turnover)', cor: 'rgb(59, 130, 246)' }
  ];

  // Calculando score (fictício baseado na inadimplência e matriz)
  let score = 85;
  if (riscoFinanceiroNivel === 'Alto') score -= 25;
  else if (riscoFinanceiroNivel === 'Médio') score -= 10;

  return {
    riscos,
    matrizRisco,
    scoreGeral: Math.max(0, Math.min(100, score))
  };
}
