'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function getEIPAnaliticoData(
  tenantId: string,
  tipoRelatorio: 'lancamentos' | 'projetos' | 'associados',
  limite: number = 500
): Promise<any[]> {
  const cookieStore = cookies()
  const supabase = await createServerSupabase()

  let table = 'lancamentos'
  let selectQuery = '*'

  if (tipoRelatorio === 'projetos') {
    table = 'projetos'
  } else if (tipoRelatorio === 'associados') {
    table = 'associados'
    selectQuery = 'id, nome, email, cpf_cnpj, status, categoria, data_adesao'
  }

  const { data, error } = await supabase
    .from(table)
    .select(selectQuery)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limite)

  if (error) {
    console.error('Erro analitico:', error)
    return []
  }

  return data || []
}
