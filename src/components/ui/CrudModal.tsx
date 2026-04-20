'use client'
import React, { useState, useEffect } from 'react'
import { X, Check, Loader2 } from 'lucide-react'

export interface Field {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'info'
  options?: { value: string; label: string }[]
  required?: boolean
  placeholder?: string
  defaultValue?: any
  showIf?: (formData: any) => boolean
  render?: (formData: any, handleChange: (name: string, value: any) => void) => React.ReactNode
}

interface CrudModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  fields: Field[]
  initialData?: any
  onSubmit: (data: any) => Promise<void>
  onChange?: (name: string, value: any, setFormData: React.Dispatch<React.SetStateAction<any>>) => void
  loading?: boolean
}

const FORMA_ICONS: Record<string, string> = {
  'Dinheiro': '💵',
  'PIX': '⚡',
  'Boleto': '🔖',
  'Transferência': '🏦',
  'Cartão': '💳',
}

const FORMA_LABELS: Record<string, string> = {
  'Dinheiro': 'Dinheiro',
  'PIX': 'PIX',
  'Boleto': 'Boleto',
  'Transferência': 'Transferência',
  'Cartão': 'Cartão',
}

export default function CrudModal({ isOpen, onClose, title, fields, initialData, onSubmit, onChange, loading: externalLoading }: CrudModalProps) {
  const [formData, setFormData] = useState<any>({})
  const [internalLoading, setInternalLoading] = useState(false)
  
  const loading = externalLoading || internalLoading

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData(initialData)
    } else if (isOpen) {
      const defaults: any = {}
      fields.forEach(f => {
        if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue
      })
      setFormData(defaults)
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setInternalLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } finally {
      setInternalLoading(false)
    }
  }

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }))
    if (onChange) onChange(name, value, setFormData)
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-hidden"
      style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)', animation: 'overlayIn .2s ease both' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-[580px] max-h-[90vh] flex flex-col relative"
        style={{
          background: '#fff',
          borderRadius: '28px',
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.4)',
          animation: 'modalIn .3s cubic-bezier(0.165, 0.84, 0.44, 1) both',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-7 bg-[#0e2d22] relative z-20 rounded-t-[28px] border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">{title}</h2>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[2px] mt-1 opacity-80 italic">Gestão Inteligente — ACPROBEC</p>
            </div>
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8 space-y-6">
            {fields.map(field => {
              if (field.showIf && !field.showIf(formData)) return null

              return (
                <div key={field.name} className="space-y-2">
                  {field.type !== 'info' && field.type !== 'checkbox' && (
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      {field.label}
                      {field.required && <span className="text-rose-500">*</span>}
                    </label>
                  )}

                  {field.type === 'info' ? (
                    field.render ? field.render(formData, handleChange) : null
                  ) : field.type === 'select' ? (
                    <div>
                      {field.name === 'forma_pagamento' ? (
                        <div className="flex flex-wrap gap-2">
                          {[{ value: '', label: 'Nenhuma' }, ...(field.options || [])].map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleChange(field.name, opt.value)}
                              className={`px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border outline-none flex items-center gap-2 ${
                                formData[field.name] === opt.value
                                  ? 'bg-[#0e2d22] border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                                  : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:border-slate-200'
                              }`}
                            >
                              {opt.value === '' ? '— ' : (FORMA_ICONS[opt.value] || '')}{' '}
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            required={field.required}
                            value={formData[field.name] ?? ''}
                            onChange={e => handleChange(field.name, e.target.value)}
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all cursor-pointer appearance-none"
                          >
                            <option value="" disabled>Selecione...</option>
                            {field.options?.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                             <Check size={14} className={formData[field.name] ? 'text-emerald-500' : 'opacity-0'} />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : field.type === 'checkbox' ? (
                    <div 
                      className={`flex items-center gap-3 p-4 rounded-2xl transition-all cursor-pointer border ${
                        !!formData[field.name] ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-50 opacity-70'
                      }`}
                      onClick={() => handleChange(field.name, !formData[field.name])}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                        !!formData[field.name] ? 'bg-emerald-500 text-white' : 'bg-slate-200'
                      }`}>
                        {!!formData[field.name] && <Check size={14} strokeWidth={4} />}
                      </div>
                      <span className={`text-[12px] font-black uppercase tracking-tight ${!!formData[field.name] ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {field.label}
                      </span>
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={formData[field.name] ?? ''}
                      onChange={e => handleChange(field.name, field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all placeholder:text-slate-300"
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 pt-6 border-t border-slate-100 mt-4 flex items-center justify-between gap-6">
             <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-4 rounded-2xl text-xs font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-[2px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-4 bg-[#0e2d22] hover:bg-[#163d2f] text-white px-8 py-5 rounded-[20px] text-xs font-black tracking-[2px] shadow-2xl shadow-indigo-500/10 border border-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} strokeWidth={4} />}
              {loading ? 'PROCESSANDO...' : 'SALVAR ALTERAÇÕES'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  )
}
