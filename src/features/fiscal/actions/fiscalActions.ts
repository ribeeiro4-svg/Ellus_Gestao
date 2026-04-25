'use server'

import { createServerSupabase } from '@/lib/supabase/server'

// Fallback para LocalStorage pois a tabela fiscal_tributacao_presets não existe no banco.
// Para habilitar persistência em nuvem, crie a tabela no Supabase usando o SQL fornecido.

export async function getTributacaoPresetsAction(tenantId: string) {
  // Retorna vazio para o componente usar o localStorage como fallback
  return { data: [], error: null }
}

export async function salvarTributacaoPresetAction(preset: any, tenantId: string) {
  return { error: 'Tabela não encontrada no banco. Usando armazenamento local.' }
}

export async function excluirTributacaoPresetAction(id: string) {
  return { error: null }
}
