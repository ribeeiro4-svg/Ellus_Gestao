'use client'
import React, { useState } from 'react'
import { Plus, MessageSquare, Book, Copy, Search, Star, Eye, Trash2, Edit, Check } from 'lucide-react'
import { useModelos } from '../hooks/useModelos'
import { useResolucoes } from '../hooks/useResolucoes'
import CrudModal, { Field } from '@/components/ui/CrudModal'
import { ModeloMensagem, Resolucao } from '@/lib/types'

export default function ModelosResolucoesTab() {
  const { modelos, loading: lMod, inserir: iMod, atualizar: aMod, remover: rMod } = useModelos()
  const { resolucoes, loading: lRes, inserir: iRes, atualizar: aRes, remover: rRes, registrarVisualizacao } = useResolucoes()
  
  const [activeSubTab, setActiveSubTab] = useState<'modelos' | 'resolucoes'>('modelos')
  const [search, setSearch] = useState('')
  
  const [isModModalOpen, setIsModModalOpen] = useState(false)
  const [editingMod, setEditingMod] = useState<ModeloMensagem | null>(null)
  
  const [isResModalOpen, setIsResModalOpen] = useState(false)
  const [editingRes, setEditingRes] = useState<Resolucao | null>(null)

  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (texto: string, id: string) => {
    navigator.clipboard.writeText(texto)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const modFields: Field[] = [
    { name: 'nome', label: 'Nome do Modelo', type: 'text', required: true },
    { name: 'categoria', label: 'Categoria', type: 'select', options: [
      { value: 'Cobrança', label: 'Cobrança' },
      { value: 'Boas-vindas', label: 'Boas-vindas' },
      { value: 'Aviso', label: 'Aviso' },
      { value: 'Outros', label: 'Outros' }
    ], required: true },
    { name: 'texto', label: 'Texto do Modelo', type: 'textarea', required: true, placeholder: 'Use {{nome}}, {{data}}, etc.' }
  ]

  const resFields: Field[] = [
    { name: 'titulo', label: 'Título do Problema', type: 'text', required: true },
    { name: 'categoria', label: 'Categoria', type: 'select', options: [
      { value: 'Financeiro', label: 'Financeiro' },
      { value: 'Sistemas', label: 'Sistemas' },
      { value: 'Associados', label: 'Associados' },
      { value: 'TI', label: 'TI' }
    ], required: true },
    { name: 'conteudo', label: 'Passos de Resolução', type: 'textarea', required: true },
    { name: 'favorito', label: 'Marcar como favorito', type: 'checkbox' }
  ]

  const filteredModelos = modelos.filter(m => 
    m.nome.toLowerCase().includes(search.toLowerCase()) || 
    m.categoria?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredResolucoes = resolucoes.filter(r => 
    r.titulo.toLowerCase().includes(search.toLowerCase()) || 
    r.categoria?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      {/* Sub-header com switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 w-fit">
          <button
            onClick={() => setActiveSubTab('modelos')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'modelos' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-400'}`}
          >
            <MessageSquare size={14} />
            Modelos de Mensagem
          </button>
          <button
            onClick={() => setActiveSubTab('resolucoes')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'resolucoes' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-400'}`}
          >
            <Book size={14} />
            Formas de Resolução
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 md:w-64">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all"
             />
          </div>
          <button
            onClick={() => activeSubTab === 'modelos' ? setIsModModalOpen(true) : setIsResModalOpen(true)}
            className={`flex items-center gap-2 ${activeSubTab === 'modelos' ? 'bg-[#0e2d22]' : 'bg-blue-800'} text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95`}
          >
            <Plus size={16} />
            {activeSubTab === 'modelos' ? 'Novo Modelo' : 'Nova Resolução'}
          </button>
        </div>
      </div>

      {/* Grid de Conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {activeSubTab === 'modelos' ? (
          filteredModelos.map(m => (
            <div key={m.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col gap-4 group">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-widest">{m.categoria}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingMod(m); setIsModModalOpen(true) }} className="p-1.5 text-slate-400 hover:text-blue-600"><Edit size={14} /></button>
                  <button onClick={() => rMod(m.id)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase leading-tight">{m.nome}</h3>
              <div className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-100 relative min-h-[120px]">
                <p className="text-xs text-slate-500 line-clamp-4 leading-relaxed italic">{m.texto}</p>
              </div>
              <button
                onClick={() => handleCopy(m.texto, m.id)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${copiedId === m.id ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-lg' : 'bg-[#0e2d22] text-white hover:bg-[#163d2f] shadow-lg'}`}
              >
                {copiedId === m.id ? <Check size={14} /> : <Copy size={14} />}
                {copiedId === m.id ? 'Copiado!' : 'Copiar Modelo'}
              </button>
            </div>
          ))
        ) : (
          filteredResolucoes.map(r => (
            <div key={r.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col gap-4 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-widest">{r.categoria}</span>
                   {r.favorito && <Star size={14} className="text-amber-400 fill-amber-400" />}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingRes(r); setIsResModalOpen(true) }} className="p-1.5 text-slate-400 hover:text-blue-600"><Edit size={14} /></button>
                  <button onClick={() => rRes(r.id)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase leading-tight">{r.titulo}</h3>
              <div className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-100 min-h-[100px]">
                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{r.conteudo}</p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Eye size={12} />
                  <span className="text-[10px] font-bold">{r.visualizacoes || 0} acessos</span>
                </div>
                <button
                  onClick={() => {
                    registrarVisualizacao(r.id)
                    // Mostrar modal de visualização completa
                  }}
                  className="text-[10px] font-black text-blue-700 uppercase tracking-widest hover:underline"
                >
                  Ver resolução completa →
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modais */}
      <CrudModal
        isOpen={isModModalOpen}
        onClose={() => { setIsModModalOpen(false); setEditingMod(null) }}
        title={editingMod ? 'Editar Modelo' : 'Novo Modelo'}
        fields={modFields}
        initialData={editingMod}
        onSubmit={async (data) => {
          if (editingMod) await aMod(editingMod.id, data)
          else await iMod(data)
        }}
      />

      <CrudModal
        isOpen={isResModalOpen}
        onClose={() => { setIsResModalOpen(false); setEditingRes(null) }}
        title={editingRes ? 'Editar Resolução' : 'Nova Resolução'}
        fields={resFields}
        initialData={editingRes}
        onSubmit={async (data) => {
          if (editingRes) await aRes(editingRes.id, data)
          else await iRes(data)
        }}
      />
    </div>
  )
}
