'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'
import type { Candidato } from '@/lib/types'

export function useCandidatos(vagaId?: string) {
  const tenantId = useTenantId()
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  const fetch = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    
    let query = sb
      .from('recrutamento_candidatos')
      .select('*')
      .eq('tenant_id', tenantId)
    
    if (vagaId) {
      query = query.eq('vaga_id', vagaId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (!error) {
      setCandidatos(data || [])
    }
    setLoading(false)
  }, [tenantId, vagaId, sb])

  useEffect(() => { fetch() }, [fetch])

  // Lógica de Inteligência: Calcula nota e define status sugerido
  const calcularResultado = (notaAdm?: number, notaDir?: number) => {
    if (notaAdm === undefined || notaDir === undefined) return null
    
    const notaFinal = (notaAdm * 0.4) + (notaDir * 0.6)
    let statusSugerido: Candidato['status'] = 'banco_talentos'

    if (notaFinal >= 8) statusSugerido = 'contratacao'
    else if (notaFinal < 6) statusSugerido = 'reprovado'

    // Trava de Divergência (> 3 pontos) ou nota individual < 5
    const temConflito = Math.abs(notaAdm - notaDir) > 3 || notaAdm < 5 || notaDir < 5

    return { notaFinal, statusSugerido, temConflito }
  }

  const inserir = async (input: Partial<Candidato>) => {
    const { data, error } = await sb
      .from('recrutamento_candidatos')
      .insert({ ...input, tenant_id: tenantId })
      .select()
      .single()
    
    if (!error) fetch()
    return { data, error }
  }

  const atualizar = async (id: string, input: Partial<Candidato>) => {
    // Se as notas foram enviadas, recalcula o final
    let dadosUpdate = { ...input }
    
    if (input.nota_adm !== undefined || input.nota_dir !== undefined) {
      const { candidatos: listaAtual } = { candidatos }
      const cand = candidatos.find(c => c.id === id)
      const nAdm = input.nota_adm ?? cand?.nota_adm
      const nDir = input.nota_dir ?? cand?.nota_dir
      
      if (nAdm !== undefined && nDir !== undefined) {
        const resultado = calcularResultado(nAdm, nDir)
        if (resultado) {
          dadosUpdate.nota_final = resultado.notaFinal
          // Só altera status automaticamente se o usuário não estiver forçando um status manual
          if (!input.status) dadosUpdate.status = resultado.statusSugerido
        }
      }
    }

    const { data, error } = await sb
      .from('recrutamento_candidatos')
      .update(dadosUpdate)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()
    
    if (!error) fetch()
    return { data, error }
  }

  const remover = async (id: string) => {
    const { error } = await sb
      .from('recrutamento_candidatos')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
    
    if (!error) fetch()
    return { error }
  }

  return { candidatos, loading, inserir, atualizar, remover, refresh: fetch, calcularResultado }
}
