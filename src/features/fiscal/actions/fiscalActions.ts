'use server'

import { createServerSupabase } from '@/lib/supabase/server'

async function getTenantId(sb: any) {
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null

  // 1. Check Metadata (Fastest)
  const metaTenant = user.app_metadata?.tenant_id || user.user_metadata?.tenant_id
  if (metaTenant) return metaTenant

  // 2. Database Fallback
  const { data: userData } = await sb.from('usuarios').select('tenant_id').eq('id', user.id).maybeSingle()
  return userData?.tenant_id || null
}

export async function getTributacaoPresetsAction() {
  const sb = await createServerSupabase()
  const tenantId = await getTenantId(sb)
  if (!tenantId) return { error: 'Tenant não identificado' }

  const { data, error } = await sb
    .from('fiscal_tributacao_presets')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('nome', { ascending: true })

  return { data, error: error?.message }
}

export async function salvarTributacaoPresetAction(preset: any) {
  const sb = await createServerSupabase()
  const tenantId = await getTenantId(sb)
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
