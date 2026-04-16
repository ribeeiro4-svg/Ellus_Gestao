'use client'
import React, { useState } from 'react'
import { 
  Settings, 
  CreditCard, 
  Plus, 
  Trash2, 
  Pencil,
  Building2,
  Wallet
} from 'lucide-react'
import { useContas } from '@/lib/hooks/useContas'
import { fmtR } from '@/lib/utils/formatters'
import CrudModal from '@/components/ui/CrudModal'

export default function ConfigPage() {
  const { contas, loading, inserir, atualizar, remover } = useContas()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const handleSalvar = async (data: any) => {
    if (editingItem) {
      await atualizar(editingItem.id, data)
    } else {
      await inserir(data)
    }
  }

  return (
    <div className="flex flex-col flex-1 gap-8 animate-in fade-in duration-500">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Settings className="text-[#2d8c6f]" />
            Configurações
          </h1>
          <p className="page-subtitle text-xs text-gray-500 mt-1 font-medium italic">
            Gerencie suas contas bancárias e parâmetros do sistema.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contas Bancárias */}
        <div className="table-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[2px] flex items-center gap-2">
              <CreditCard className="text-[#2d8c6f] w-4 h-4" />
              Contas Bancárias
            </h2>
            <button 
              onClick={() => { setEditingItem(null); setIsModalOpen(true) }}
              className="px-4 py-2 bg-[#2d8c6f]/10 text-[#2d8c6f] text-[10px] font-bold rounded-xl hover:bg-[#2d8c6f]/20 uppercase"
            >
              + Nova Conta
            </button>
          </div>

          <div className="space-y-4">
            {contas.map(conta => (
              <div key={conta.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#2d8c6f] shadow-sm">
                    {conta.tipo === 'caixa_fisico' ? <Wallet size={20} /> : <Building2 size={20} />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-800">{conta.nome}</div>
                    <div className="text-[10px] text-gray-400 uppercase font-black">{conta.tipo.replace('_', ' ')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400 uppercase font-bold">Saldo Inicial</div>
                    <div className="text-sm font-black text-gray-700">{fmtR(conta.saldo_inicial)}</div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingItem(conta); setIsModalOpen(true) }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={14} /></button>
                    <button onClick={() => confirm('Excluir esta conta?') && remover(conta.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
            {contas.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-400 text-xs italic">Nenhuma conta cadastrada.</div>
            )}
          </div>
        </div>
      </div>

      <CrudModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Conta' : 'Cadastrar Conta Bancária'}
        initialData={editingItem}
        onSubmit={handleSalvar}
        fields={[
          { name: 'nome', label: 'Nome da Conta', type: 'text', required: true, placeholder: 'Ex: Cora ACPROBEC, Bradesco...' },
          { name: 'tipo', label: 'Tipo de Conta', type: 'select', required: true, options: [
            { value: 'corrente', label: 'Conta Corrente' },
            { value: 'poupanca', label: 'Conta Poupança' },
            { value: 'caixa_fisico', label: 'Caixa Físico' },
          ]},
          { name: 'saldo_inicial', label: 'Saldo Inicial (R$)', type: 'number', required: true },
        ]}
      />
    </div>
  )
}
