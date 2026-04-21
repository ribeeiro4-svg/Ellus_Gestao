'use client'
import React, { useState, useMemo, useEffect } from 'react'
import { X, Search, Store, CheckCircle2, UserCheck, Plus } from 'lucide-react'
import { useFornecedores } from '@/lib/hooks/useFornecedores'
import CrudModal from '@/components/ui/CrudModal'
import { useDiretoria } from '@/lib/hooks/useDiretoria'

interface SupplierMatchModalProps {
  isOpen: boolean
  onClose: () => void
  extrato: any
  onSelect: (sup: any) => void
}

export default function SupplierMatchModal({ isOpen, onClose, extrato, onSelect }: SupplierMatchModalProps) {
  const { fornecedores, inserir } = useFornecedores()
  const { diretoria } = useDiretoria()
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false)
  const [apiData, setApiData] = useState<any>(null)

  const handleSalvarNovo = async (data: any) => {
    try {
      const res = await inserir({ ...data, status: 'ativo' })
      if (res?.data?.[0]) {
        onSelect(res.data[0])
        setIsCreateOpen(false)
        onClose()
      } else if (res?.error) {
        const errorMsg = typeof res.error === 'string' ? res.error : (res.error as any)?.message || 'Erro desconhecido'
        alert(`Erro ao cadastrar: ${errorMsg}`)
      }
    } catch (err) {
      alert('Erro ao cadastrar fornecedor')
    }
  }

  const allItems = useMemo(() => {
    const list = [...fornecedores]
    diretoria.forEach(d => list.push({ ...d, isDirector: true } as any))
    return list
  }, [fornecedores, diretoria])

  const filtered = useMemo(() => {
    if (!search) return []
    return allItems.filter(f => 
      f.nome.toLowerCase().includes(search.toLowerCase()) || 
      (f.cpf_cnpj && f.cpf_cnpj.includes(search))
    ).slice(0, 10)
  }, [allItems, search])

  const extractedDoc = useMemo(() => {
    const memo = extrato?.bank?.memo || ''
    const match = memo.match(/(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})|(\d{3}\.?\d{3}\.?\d{3}-?\d{2})|(\d{14})|(\d{11})/)
    return match ? match[0] : ''
  }, [extrato])

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

    if (isCreateOpen && extractedDoc) {
      const cleanCnpj = extractedDoc.replace(/\D/g, '')
      if (cleanCnpj.length === 14) {
        fetchCnpjData(cleanCnpj)
      }
    } else if (!isCreateOpen) {
      setApiData(null)
    }
  }, [isCreateOpen, extractedDoc])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-indigo-950 tracking-tight">Vincular Fornecedor/Diretor</h2>
            <div className="flex items-center flex-wrap gap-2 mt-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">Busque na base pelo nome ou documento</p>
              <span className="text-gray-300 hidden sm:inline">•</span>
              <button 
                onClick={() => setIsCreateOpen(true)}
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                <Plus size={10} strokeWidth={4} />
                Novo Fornecedor
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-2xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="px-8 pb-8 pt-4">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
            <input 
              autoFocus
              type="text" 
              placeholder="Digite o nome..." 
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-[24px] text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {filtered.length > 0 ? (
              filtered.map((item: any) => (
                <button 
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                       item.isDirector ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                    }`}>
                      {item.isDirector ? <UserCheck size={18} /> : <Store size={18} />}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-gray-800 uppercase group-hover:text-indigo-900 transition-colors">{item.nome}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">
                        {item.isDirector ? 'DIRETORIA' : (item.cpf_cnpj || 'Sem Documento')}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 size={18} className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              ))
            ) : search ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                <Search size={32} className="mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest text-center">Nenhum fornecedor<br/>encontrado para "{search}"</p>
                <button 
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-6 px-6 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[2px] rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                >
                  Cadastrar Agora
                </button>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                <Store size={32} className="mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest text-center">Comece a digitar para pesquisar</p>
              </div>
            )}
          </div>
          </div>
      </div>

      <CrudModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={isFetchingCnpj ? 'Buscando Dados do CNPJ...' : 'Novo Fornecedor'}
        onSubmit={handleSalvarNovo}
        loading={isFetchingCnpj}
        initialData={apiData}
        fields={[
          { name: 'nome', label: 'Nome / Razão Social', type: 'text', required: true, defaultValue: apiData?.nome || search },
          { name: 'cpf_cnpj', label: 'CPF ou CNPJ', type: 'text', defaultValue: apiData?.cpf_cnpj || extractedDoc },
          { name: 'email', label: 'E-mail', type: 'text', defaultValue: apiData?.email || '' },
          { name: 'telefone', label: 'Telefone / WhatsApp', type: 'text', defaultValue: apiData?.telefone || '' },
          { name: 'categoria_padrao', label: 'Categoria de Despesa', type: 'text', placeholder: 'Ex: Energia, Serviços, Aluguel' },
        ]}
      />
    </div>
  )
}
