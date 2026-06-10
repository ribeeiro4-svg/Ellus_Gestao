import React, { useState, useEffect } from 'react'
import { X, CheckSquare, Square, Download, Zap } from 'lucide-react'
import { fmtR } from '@/lib/utils/formatters'

interface PreviewAdesoesModalProps {
  isOpen: boolean
  onClose: () => void
  previewData: any[]
  onConfirm: (selected: any[]) => Promise<void>
}

export default function PreviewAdesoesModal({ isOpen, onClose, previewData, onConfirm }: PreviewAdesoesModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen && previewData) {
      setSelectedIds(new Set(previewData.map(item => item.associado_id)))
    }
  }, [isOpen, previewData])

  if (!isOpen) return null

  const handleToggle = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  const handleToggleAll = () => {
    if (selectedIds.size === previewData.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(previewData.map(item => item.associado_id)))
    }
  }

  const handleConfirm = async () => {
    if (selectedIds.size === 0) {
      alert('Selecione pelo menos um associado para lançar a adesão.')
      return
    }

    const selectedItems = previewData.filter(item => selectedIds.has(item.associado_id))
    
    setIsSubmitting(true)
    try {
      await onConfirm(selectedItems)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center shadow-inner">
              <Zap size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Lançar Adesões</h2>
              <p className="text-sm font-bold text-slate-400">
                Selecione os associados que receberão o lançamento da taxa de adesão
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {previewData.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare size={32} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">Tudo em dia!</h3>
              <p className="text-slate-500 font-medium">Não há novos associados pendentes de taxa de adesão.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2 mb-2">
                <button
                  onClick={handleToggleAll}
                  className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  {selectedIds.size === previewData.length ? (
                    <CheckSquare size={18} className="text-teal-500" />
                  ) : (
                    <Square size={18} className="text-slate-400" />
                  )}
                  {selectedIds.size === previewData.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                </button>
                <span className="text-sm font-bold text-slate-400">
                  {selectedIds.size} de {previewData.length} selecionados
                </span>
              </div>

              <div className="space-y-2">
                {previewData.map((item, idx) => {
                  const isSelected = selectedIds.has(item.associado_id)
                  // Extrai o nome da descrição "ADESÃO DE ASSOCIADO - NOME"
                  const nomeAssociado = item.descricao.split(' - ')[1] || 'Associado'
                  
                  return (
                    <div 
                      key={item.associado_id || idx}
                      onClick={() => handleToggle(item.associado_id)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-teal-500 bg-teal-50/50 shadow-sm' 
                          : 'border-transparent bg-white hover:border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-slate-400">
                          {isSelected ? (
                            <CheckSquare size={20} className="text-teal-500" />
                          ) : (
                            <Square size={20} />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{nomeAssociado}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            Vencimento: {item.data.split('-').reverse().join('/')}
                          </div>
                        </div>
                      </div>
                      <div className="font-black text-slate-800">
                        {fmtR(item.valor)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-6 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          
          {previewData.length > 0 && (
            <button
              onClick={handleConfirm}
              disabled={isSubmitting || selectedIds.size === 0}
              className="px-6 py-3 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>Processando...</>
              ) : (
                <>Confirmar e Lançar ({selectedIds.size})</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
