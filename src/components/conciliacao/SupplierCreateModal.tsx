'use client'
import React, { useState, useEffect } from 'react'
import { useFornecedores } from '@/lib/hooks/useFornecedores'
import CrudModal from '@/components/ui/CrudModal'

interface SupplierCreateModalProps {
  isOpen: boolean
  onClose: () => void
  memo?: string
  onSuccess: (sup: any) => void
  inserir: (data: any) => Promise<any>
}

export default function SupplierCreateModal({ isOpen, onClose, memo, onSuccess, inserir }: SupplierCreateModalProps) {
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false)
  const [apiData, setApiData] = useState<any>(null)

  const extractedDoc = React.useMemo(() => {
    if (!memo) return ''
    const match = memo.match(/(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})|(\d{3}\.?\d{3}\.?\d{3}-?\d{2})|(\d{14})|(\d{11})/)
    return match ? match[0] : ''
  }, [memo])

  useEffect(() => {
    const fetchCnpjData = async (cnpj: string) => {
      setIsFetchingCnpj(true)
      try {
        const res = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`)
        if (!res.ok) throw new Error('Falha na API')
        const data = await res.json()
        if (data && data.razao_social) {
          setApiData({
            nome: data.razao_social,
            email: data.estabelecimento?.email || '',
            telefone: `${data.estabelecimento?.ddd1 || ''}${data.estabelecimento?.telefone1 || ''}`,
            cpf_cnpj: cnpj
          })
        }
      } catch (err) {
        console.warn('Erro ao buscar dados do CNPJ:', err)
      } finally {
        setIsFetchingCnpj(false)
      }
    }

    if (isOpen && extractedDoc) {
      const cleanCnpj = extractedDoc.replace(/\D/g, '')
      if (cleanCnpj.length === 14) {
        fetchCnpjData(cleanCnpj)
      }
    } else if (!isOpen) {
      setApiData(null)
    }
  }, [isOpen, extractedDoc])

  const handleSalvarNovo = async (data: any) => {
    try {
      const res = await inserir({ ...data, status: 'ativo' })
      if (res?.data?.[0]) {
        onSuccess(res.data[0])
        onClose()
      } else if (res?.error) {
        const errorMsg = typeof res.error === 'string' ? res.error : (res.error as any)?.message || 'Erro desconhecido'
        alert(`Erro ao cadastrar: ${errorMsg}`)
      }
    } catch (err) {
      alert('Erro ao cadastrar fornecedor')
    }
  }

  return (
    <CrudModal 
      isOpen={isOpen}
      onClose={onClose}
      title={isFetchingCnpj ? 'Buscando Dados do CNPJ...' : 'Novo Fornecedor'}
      onSubmit={handleSalvarNovo}
      loading={isFetchingCnpj}
      initialData={apiData}
      fields={[
        { name: 'nome', label: 'Nome / Razão Social', type: 'text', required: true, defaultValue: apiData?.nome || '' },
        { name: 'cpf_cnpj', label: 'CPF ou CNPJ', type: 'text', defaultValue: apiData?.cpf_cnpj || extractedDoc },
        { name: 'email', label: 'E-mail', type: 'text', defaultValue: apiData?.email || '' },
        { name: 'telefone', label: 'Telefone / WhatsApp', type: 'text', defaultValue: apiData?.telefone || '' },
        { name: 'categoria_padrao', label: 'Categoria de Despesa', type: 'text', placeholder: 'Ex: Energia, Serviços, Aluguel' },
      ]}
    />
  )
}
