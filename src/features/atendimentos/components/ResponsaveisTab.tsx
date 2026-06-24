'use client'
import React, { useState } from 'react'
import { Plus, Trash2, Edit2, Loader2, UserPlus, Phone } from 'lucide-react'
import { useAtendimentos } from '@/lib/hooks/useAtendimentos'

export default function CorretoresTab() {
  const { responsaveis, loading, inserirResponsavel, atualizarResponsavel, removerResponsavel } = useAtendimentos()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [editId, setEditId] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [tipo, setTipo] = useState('Venda do Plano')

  const corretores = responsaveis.filter(r => r.tipo === 'Venda do Plano')

  const openNew = () => {
    setEditId(null)
    setNome('')
    setTelefone('')
    setIsModalOpen(true)
  }

  const openEdit = (r: any) => {
    setEditId(r.id)
    setNome(r.nome)
    setTelefone(r.telefone || '')
    setTipo('Venda do Plano')
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!nome) return alert('Nome é obrigatório')
    setSaving(true)
    let result: any
    if (editId) {
      result = await atualizarResponsavel(editId, { nome, telefone, tipo })
    } else {
      result = await inserirResponsavel({ nome, telefone, tipo })
    }
    setSaving(false)
    if (result?.error) {
      console.error('[CorretoresTab] Erro ao salvar:', result.error)
      alert(`Erro ao salvar corretor: ${result.error?.message || JSON.stringify(result.error)}`)
      return
    }
    setIsModalOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este corretor?')) {
      await removerResponsavel(id)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Cadastro de Corretores</h3>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Pessoas vinculadas à venda de planos para comissionamento.</p>
        </div>
        <button 
          onClick={openNew}
          className="btn-primary text-[11px] uppercase font-black px-4 py-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <UserPlus size={14} /> Novo Corretor
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-10"><Loader2 className="animate-spin text-blue-500" /></div>
      ) : responsaveis.length === 0 ? (
        <div className="p-10 text-center text-slate-500 text-sm font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          Nenhum corretor cadastrado ainda.
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Sessão Única Corretores */}
          <div className="flex flex-col gap-4">
            {corretores.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum corretor de vendas cadastrado.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {corretores.map(r => (
                  <div key={r.id} className="p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-md transition-shadow flex flex-col gap-3 group">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm uppercase">{r.nome}</span>
                        {r.telefone && (
                          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-1">
                            <Phone size={10} /> {r.telefone}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(r)} className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>


        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm p-6 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">{editId ? 'Editar' : 'Novo'} Corretor</h2>
            
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Nome Completo</span>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: João Silva"
                />
              </label>


              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Telefone (Opcional)</span>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500"
                  value={telefone}
                  onChange={e => setTelefone(e.target.value)}
                  placeholder="Ex: (87) 99999-9999"
                />
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary text-xs uppercase font-black py-3 bg-slate-100 text-slate-600 hover:bg-slate-200">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary text-xs uppercase font-black py-3 bg-blue-600 hover:bg-blue-700">
                {saving ? <Loader2 size={14} className="animate-spin mx-auto"/> : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
