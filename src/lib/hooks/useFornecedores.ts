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

    // Validação de Duplicidade
    const cpfCnpjLimpo = obj.cpf_cnpj?.replace(/\D/g, '')
    if (cpfCnpjLimpo) {
      const { data: existente } = await sb.from('fornecedores')
        .select('id, nome')
        .eq('tenant_id', tenantId)
        .eq('cpf_cnpj', cpfCnpjLimpo)
        .maybeSingle()
      
      if (existente) {
        return { error: `Já existe um fornecedor cadastrado com este CPF/CNPJ: ${existente.nome}` }
      }
    }

    // Auto-gerar conta contábil para o fornecedor
    // Auto-gerar conta contábil para o fornecedor
    let contaContabilId = obj.conta_contabil_id
    if (!contaContabilId) {
      try {
        const parentCodigo = '2.1.2'
        
        // 1. Garantir conta pai
        let { data: pai } = await sb.from('plano_contas').select('*').eq('tenant_id', tenantId).eq('codigo', parentCodigo).maybeSingle()
        
        if (!pai) {
          const { data: novaPai } = await sb.from('plano_contas').insert({
            tenant_id: tenantId, codigo: parentCodigo, descricao: 'FORNECEDORES',
            nivel: 3, tipo: 'sintetica', natureza: 'credora', classificacao: 'passivo', aceita_lancamentos: false, ativa: true
          }).select().single()
          pai = novaPai
        } else if (pai.tipo === 'analitica') {
          await sb.from('plano_contas').update({ tipo: 'sintetica', aceita_lancamentos: false }).eq('id', pai.id)
        }

        // 2. Proximo codigo
        const { data: ultimasContas } = await sb.from('plano_contas')
          .select('codigo')
          .eq('tenant_id', tenantId)
          .like('codigo', `${parentCodigo}.%`)
          .order('codigo', { ascending: false })
          .limit(1)

        let nextSeq = 1
        if (ultimasContas && ultimasContas.length > 0) {
          const ultimo = ultimasContas[0].codigo
          const partes = ultimo.split('.')
          const sequencial = parseInt(partes[partes.length - 1], 10)
          if (!isNaN(sequencial)) nextSeq = sequencial + 1
        }
        
        const novoCodigo = `${parentCodigo}.${String(nextSeq).padStart(3, '0')}`

        // 3. Criar conta
        const { data: novaConta } = await sb.from('plano_contas').insert({
          tenant_id: tenantId,
          codigo: novoCodigo,
          descricao: `FORNECEDOR: ${obj.nome?.toUpperCase()}`,
          nivel: 4,
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
      .insert([{ ...obj, cpf_cnpj: cpfCnpjLimpo || obj.cpf_cnpj, tenant_id: tenantId, conta_contabil_id: contaContabilId }])
      .select()
    if (!error) await fetchFornecedores()
    return { data, error }
  }

  const atualizarFornecedor = async (id: string, obj: Partial<Fornecedor>) => {
    if (!tenantId) return { error: 'Tenant não identificado' }

    const cpfCnpjLimpo = obj.cpf_cnpj?.replace(/\D/g, '')
    if (cpfCnpjLimpo) {
      const { data: existente } = await sb.from('fornecedores')
        .select('id, nome')
        .eq('tenant_id', tenantId)
        .eq('cpf_cnpj', cpfCnpjLimpo)
        .neq('id', id)
        .maybeSingle()
      
      if (existente) {
        return { error: `Este CPF/CNPJ já está em uso pelo fornecedor: ${existente.nome}` }
      }
    }

    const { error } = await sb
      .from('fornecedores')
      .update({ ...obj, cpf_cnpj: cpfCnpjLimpo || obj.cpf_cnpj })
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
