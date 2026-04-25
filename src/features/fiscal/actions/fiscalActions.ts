'use server'

import { createServerSupabase } from '@/lib/supabase/server'

export async function getTributacaoPresetsAction(tenantId: string) {
  const sb = await createServerSupabase()
  if (!tenantId) return { error: 'Tenant não identificado' }

  const { data, error } = await sb
    .from('fiscal_tributacao_presets')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nome', { ascending: true })

  return { data, error: error?.message }
}

export async function salvarTributacaoPresetAction(preset: any, tenantId: string) {
  const sb = await createServerSupabase()
  if (!tenantId) return { error: 'Tenant não identificado' }

  const { error } = await sb
    .from('fiscal_tributacao_presets')
    .insert({
      ...preset,
      tenant_id: tenantId
    })

  return { error: error?.message }
}

export async function excluirTributacaoPresetAction(id: string) {
  const sb = await createServerSupabase()
  const { error } = await sb
    .from('fiscal_tributacao_presets')
    .delete()
    .eq('id', id)

  return { error: error?.message }
}
