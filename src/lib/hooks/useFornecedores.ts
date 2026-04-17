import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useTenantId } from './useTenantId'

export interface Fornecedor {
  id: string
  nome: string
  cpf_cnpj: string | null
  email: string | null
  telefone: string | null
  categoria_padrao: string | null
  status: 'ativo' | 'inativo'
  created_at: string
}

export function useFornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const tenantId = useTenantId()

  const fetchFornecedores = async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('nome')
      
      if (!error && data) {
        setFornecedores(data)
      } else if (error) {
        console.error('Erro ao buscar fornecedores:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const inserirFornecedor = async (obj: Partial<Fornecedor>) => {
    if (!tenantId) return { error: 'Tenant não identificado' }
    const { data, error } = await supabase
      .from('fornecedores')
      .insert([{ ...obj, tenant_id: tenantId }])
      .select()
    if (!error) await fetchFornecedores()
    return { data, error }
  }

  const atualizarFornecedor = async (id: string, obj: Partial<Fornecedor>) => {
    const { error } = await supabase
      .from('fornecedores')
      .update(obj)
      .eq('id', id)
    if (!error) await fetchFornecedores()
    return { error }
  }

  const excluirFornecedor = async (id: string) => {
    const { error } = await supabase
      .from('fornecedores')
      .delete()
      .eq('id', id)
    if (!error) await fetchFornecedores()
    return { error }
  }

  useEffect(() => {
    fetchFornecedores()
  }, [tenantId])

  return { 
    fornecedores, 
    loading, 
    fetch: fetchFornecedores, 
    inserir: inserirFornecedor, 
    atualizar: atualizarFornecedor, 
    excluir: excluirFornecedor 
  }
}
