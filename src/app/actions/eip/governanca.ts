'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface EIPGovernancaData {
  kpis: {
    termosAssinados: number;
    pendenciasAssinatura: number;
    taxaCompliance: number;
    alertasCriticos: number;
  };
  complianceAoLongoDoTempo: {
    mesAno: string;
    assinados: number;
  }[];
  auditoriaSimulada: {
    evento: string;
    data: string;
    usuario: string;
    severidade: 'baixa' | 'media' | 'alta';
  }[];
}

export async function getEIPGovernancaData(tenantId: string): Promise<EIPGovernancaData> {
  const cookieStore = cookies()
  const supabase = await createServerSupabase()

  // Para Governança e Compliance, vamos usar as assinaturas da ZapSign nos associados
  const { data: associados, error } = await supabase
    .from('associados')
    .select('id, termo_status, zapsign_doc_token, created_at')
    .eq('tenant_id', tenantId)

  if (error) {
    console.error("Governanca Error:", error)
  }

  let termosAssinados = 0
  let pendenciasAssinatura = 0
  const crescMap: Record<string, number> = {}

  associados?.forEach(row => {
    // Simulando regras de compliance
    if (row.termo_status === 'Assinado' || row.zapsign_doc_token) {
      termosAssinados++
      const dataReq = new Date(row.created_at)
      const mesAno = dataReq.toISOString().substring(0, 7)
      crescMap[mesAno] = (crescMap[mesAno] || 0) + 1
    } else {
      pendenciasAssinatura++
    }
  })

  const total = termosAssinados + pendenciasAssinatura
  const taxaCompliance = total > 0 ? (termosAssinados / total) * 100 : 0

  const complianceAoLongoDoTempo = Object.keys(crescMap)
    .sort()
    .slice(-6)
    .map(k => ({
      mesAno: k,
      assinados: crescMap[k]
    }))

  const auditoriaSimulada: EIPGovernancaData['auditoriaSimulada'] = [
    { evento: 'Exportação em massa de associados', data: new Date().toISOString(), usuario: 'Admin', severidade: 'media' },
    { evento: 'Alteração de configurações do sistema', data: new Date(Date.now() - 86400000).toISOString(), usuario: 'Admin', severidade: 'baixa' },
    { evento: 'Falha de login (Múltiplas tentativas)', data: new Date(Date.now() - 172800000).toISOString(), usuario: 'Desconhecido', severidade: 'alta' },
    { evento: 'Exclusão de Projeto Estratégico', data: new Date(Date.now() - 259200000).toISOString(), usuario: 'Gerente', severidade: 'alta' },
  ]

  return {
    kpis: {
      termosAssinados,
      pendenciasAssinatura,
      taxaCompliance,
      alertasCriticos: 2
    },
    complianceAoLongoDoTempo,
    auditoriaSimulada
  }
}
