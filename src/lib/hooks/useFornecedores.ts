import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from './useTenantId'

export interface Fornecedor {
  id: string
  nome: string
  cpf_cnpj: string | null
  email: string | null
  telefone: string | null
  categoria_padrao: string | null
  status: 'ativo' | 'inativo'
  conta_contabil_id: string | null
  created_at: string
}

export function useFornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const tenantId = useTenantId()
  const sb = createClient()

  const fetchFornecedores = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const { data, error } = await sb
        .from('fornecedores')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('nome')
      
      if (!error && data) {
        setFornecedores(data)
      }
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const inserirFornecedor = async (obj: Partial<Fornecedor>) => {
    if (!tenantId) return { error: 'Tenant não identificado' }

    // Auto-gerar conta contábil para o fornecedor
    let contaContabilId = obj.conta_contabil_id
    if (!contaContabilId) {
      try {
        const { data: ultimasContas } = await sb.from('plano_contas')
          .select('codigo')
          .eq('tenant_id', tenantId)
          .like('codigo', '2.1.3.01.%')
          .order('codigo', { ascending: false })
          .limit(1)

        let novoCodigo = '2.1.3.01.100' // Começa no 100 para evitar conflitos com ITG padrão
        if (ultimasContas && ultimasContas.length > 0) {
          const ultimo = ultimasContas[0].codigo
          const partes = ultimo.split('.')
          const sequencial = parseInt(partes[partes.length - 1], 10)
          if (!isNaN(sequencial) && sequencial >= 100) {
            novoCodigo = `2.1.3.01.${String(sequencial + 1).padStart(3, '0')}`
          }
        }

        const { data: pai } = await sb.from('plano_contas').select('id').eq('tenant_id', tenantId).eq('codigo', '2.1.3.01').single()

        const { data: novaConta } = await sb.from('plano_contas').insert({
          tenant_id: tenantId,
          codigo: novoCodigo,
          descricao: `Fornecedor: ${obj.nome}`,
          nivel: 5,
          tipo: 'analitica',
          natureza: 'credora',
          classificacao: 'passivo',
          aceita_lancamentos: true,
          ativa: true,
          conta_pai_id: pai?.id || null
        }).select('id').single()

        if (novaConta) contaContabilId = novaConta.id
      } catch (err) {
        console.error('Erro ao auto-gerar conta do fornecedor:', err)
      }
    }

    const { data, error } = await sb
      .from('fornecedores')
      .insert([{ ...obj, tenant_id: tenantId, conta_contabil_id: contaContabilId }])
      .select()
    if (!error) await fetchFornecedores()
    return { data, error }
  }

  const atualizarFornecedor = async (id: string, obj: Partial<Fornecedor>) => {
    const { error } = await sb
      .from('fornecedores')
      .update(obj)
      .eq('id', id)
    if (!error) await fetchFornecedores()
    return { error }
  }

  const excluirFornecedor = async (id: string) => {
    const { error } = await sb
      .from('fornecedores')
      .delete()
      .eq('id', id)
    if (!error) await fetchFornecedores()
    return { error }
  }

  useEffect(() => {
    fetchFornecedores()
  }, [fetchFornecedores])

  return { 
    fornecedores, 
    loading, 
    fetch: fetchFornecedores, 
    inserir: inserirFornecedor, 
    atualizar: atualizarFornecedor, 
    excluir: excluirFornecedor 
  }
}
