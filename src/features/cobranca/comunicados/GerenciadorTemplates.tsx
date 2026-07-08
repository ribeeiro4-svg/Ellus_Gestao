'use client'
import React, { useState } from 'react'
import { ComunicadoTemplate } from '@/lib/hooks/useComunicados'
import { FileText, Plus, Copy, Trash2, Save, Pencil, X, Loader2 } from 'lucide-react'

interface GerenciadorTemplatesProps {
  templates: ComunicadoTemplate[]
  loading: boolean
  selectedTemplateId: string | null
  onSelectTemplate: (id: string | null) => void
  onSave: (t: Partial<ComunicadoTemplate>) => Promise<{error: any}>
  onUpdate: (id: string, t: Partial<ComunicadoTemplate>) => Promise<{error: any}>
  onDelete: (id: string) => Promise<{error: any}>
}

export const VARIAVEIS_DISPONIVEIS = [
  '{NOME}', '{PRIMEIRO_NOME}', '{CPF}', '{PLANO}', '{STATUS}', '{VENCIMENTO}', '{VALOR}', '{LINK_PAGAMENTO}', '{TELEFONE}', '{DATA_ATUAL}'
]

const CATEGORIAS = ['Cobrança', 'Financeiro', 'Administrativo', 'Benefícios', 'Eventos', 'Geral']

export default function GerenciadorTemplates({
  templates,
  loading,
  selectedTemplateId,
  onSelectTemplate,
  onSave,
  onUpdate,
  onDelete
}: GerenciadorTemplatesProps) {

  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<ComunicadoTemplate>>({})
  const [isSaving, setIsSaving] = useState(false)
  
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

  const handleNew = () => {
    setEditData({ nome: '', categoria: 'Geral', conteudo: '' })
    setIsEditing(true)
    onSelectTemplate(null)
  }

  const handleEdit = () => {
    if (selectedTemplate) {
      setEditData(selectedTemplate)
      setIsEditing(true)
    }
  }

  const handleDuplicate = () => {
    if (selectedTemplate) {
      setEditData({
        ...selectedTemplate,
        id: undefined,
        nome: `${selectedTemplate.nome} (Cópia)`
      })
      setIsEditing(true)
      onSelectTemplate(null)
    }
  }

  const handleDelete = async () => {
    if (selectedTemplate && window.confirm('Deseja realmente excluir este template?')) {
      setIsSaving(true)
      await onDelete(selectedTemplate.id)
      onSelectTemplate(null)
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    if (!editData.nome || !editData.conteudo) {
      alert('Preencha o nome e o conteúdo da mensagem.')
      return
    }
    
    setIsSaving(true)
    if (editData.id) {
      const { error } = await onUpdate(editData.id, editData)
      if (!error) setIsEditing(false)
      else alert(`Erro ao salvar: ${error.message || JSON.stringify(error)}`)
    } else {
      const { error } = await onSave(editData)
      if (!error) setIsEditing(false)
      else alert(`Erro ao salvar: ${error.message || JSON.stringify(error)}`)
    }
    setIsSaving(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData({})
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col h-fit">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-700">
          <FileText size={18} />
          <h3 className="font-bold text-sm uppercase tracking-wider">Modelo de Mensagem</h3>
        </div>
        {!isEditing ? (
          <button
            onClick={handleNew}
            className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg shadow-sm shadow-amber-500/20 transition-colors"
          >
            <Plus size={14} /> Novo
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg shadow-sm shadow-emerald-500/20 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Salvar
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Nome do Template</label>
            <input
              type="text"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              value={editData.nome || ''}
              onChange={e => setEditData({...editData, nome: e.target.value})}
              placeholder="Ex: Cobrança Amigável"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Categoria</label>
            <select
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              value={editData.categoria || 'Geral'}
              onChange={e => setEditData({...editData, categoria: e.target.value})}
            >
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Conteúdo da Mensagem</label>
            <textarea
              className="w-full flex-1 min-h-[150px] px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-y"
              value={editData.conteudo || ''}
              onChange={e => setEditData({...editData, conteudo: e.target.value})}
              placeholder="Olá {PRIMEIRO_NOME}, tudo bem? ..."
            />
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Variáveis Automáticas:</span>
              <div className="flex flex-wrap gap-1">
                {VARIAVEIS_DISPONIVEIS.map(v => (
                  <button 
                    key={v}
                    onClick={() => setEditData({...editData, conteudo: (editData.conteudo || '') + v})}
                    className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 hover:text-amber-600 hover:border-amber-300 transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-slate-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Selecione um Template</label>
                <select
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  value={selectedTemplateId || ''}
                  onChange={e => onSelectTemplate(e.target.value || null)}
                >
                  <option value="">-- Selecione --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.nome} ({t.categoria})</option>
                  ))}
                </select>
              </div>

              {selectedTemplate && (
                <div className="flex flex-col gap-3">
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 relative group">
                    <span className="absolute top-3 right-3 text-[10px] font-bold text-slate-400 uppercase bg-white px-2 py-0.5 rounded shadow-sm">
                      {selectedTemplate.categoria}
                    </span>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap mt-2">{selectedTemplate.conteudo}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleEdit}
                      className="flex-1 px-3 py-2 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <Pencil size={14} /> Editar
                    </button>
                    <button
                      onClick={handleDuplicate}
                      className="flex-1 px-3 py-2 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <Copy size={14} /> Duplicar
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isSaving}
                      className="flex-none px-3 py-2 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50"
                      title="Excluir"
                    >
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
