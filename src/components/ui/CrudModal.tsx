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
}

const PAGAMENTO_ICONS: Record<string, string> = {
  'Dinheiro': '💵',
  'PIX': '⚡',
  'Boleto': '🔖',
  'Transferência': '🏦',
  'Cartão': '💳',
}

export default function CrudModal({ isOpen, onClose, title, fields, initialData, onSubmit, onChange }: CrudModalProps) {
  const [formData, setFormData] = useState<any>({})
  const [loading, setLoading] = useState(false)

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
  }, [initialData, isOpen, fields])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }))
    if (onChange) onChange(name, value, setFormData)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(8px)', animation: 'overlayIn .2s ease both' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-[520px] max-h-[88vh] overflow-y-auto relative"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          animation: 'modalIn .28s ease both',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between sticky top-0 z-10"
          style={{
            padding: '22px 24px 18px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        >
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text1)', marginBottom: 2 }}>{title}</h2>
            <p style={{ fontSize: 12, color: 'var(--text3)' }}>Preencha os campos abaixo</p>
          </div>
          <button
            onClick={onClose}
            className="transition"
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text2)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px 24px', display: 'grid', gap: 14 }}>
            {fields.map(field => {
              if (field.showIf && !field.showIf(formData)) return null

              return (
                <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {field.type !== 'info' && (
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text2)', display: 'block' }}>
                      {field.label}{field.required && <span style={{ color: 'var(--red)' }}> *</span>}
                    </label>
                  )}
 
                  {field.type === 'info' ? (
                    field.render ? field.render(formData, handleChange) : null
                  ) : field.type === 'select' ? (
                    <div>
                      {field.name === 'forma_pagamento' ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {[{ value: '', label: '— Nenhuma' }, ...(field.options || [])].map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleChange(field.name, opt.value)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                border: `1.5px solid ${formData[field.name] === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                                background: formData[field.name] === opt.value ? 'rgba(45,140,111,.12)' : 'var(--surface2)',
                                color: formData[field.name] === opt.value ? 'var(--accent)' : 'var(--text2)',
                                transition: 'var(--trans-fast)',
                              }}
                            >
                              {opt.value && PAGAMENTO_ICONS[opt.value] ? `${PAGAMENTO_ICONS[opt.value]} ` : ''}{opt.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <select
                          required={field.required}
                          value={formData[field.name] || ''}
                          onChange={e => handleChange(field.name, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            border: '1.5px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 13,
                            fontFamily: 'inherit',
                            color: 'var(--text1)',
                            background: 'var(--surface)',
                            outline: 'none',
                            cursor: 'pointer',
                            transition: 'var(--trans-fast)',
                          }}
                        >
                          <option value="" disabled>Selecione...</option>
                          {field.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      required={field.required}
                      value={formData[field.name] || ''}
                      placeholder={field.placeholder}
                      onChange={e => handleChange(field.name, e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        border: '1.5px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 13,
                        fontFamily: 'inherit',
                        color: 'var(--text1)',
                        background: 'var(--surface)',
                        outline: 'none',
                        resize: 'vertical',
                        transition: 'var(--trans-fast)',
                      }}
                    />
                  ) : field.type === 'checkbox' ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input 
                        type="checkbox"
                        checked={!!formData[field.name]}
                        onChange={e => handleChange(field.name, e.target.checked)}
                        style={{ cursor: 'pointer', width: 16, height: 16 }}
                      />
                      <span className="text-sm font-medium text-slate-600">{field.placeholder || field.label}</span>
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={e => handleChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        border: '1.5px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 13,
                        fontFamily: 'inherit',
                        color: 'var(--text1)',
                        background: 'var(--surface)',
                        outline: 'none',
                        transition: 'var(--trans-fast)',
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              padding: '16px 24px 20px',
              borderTop: '1px solid var(--border)',
            }}
          >
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '10px 16px' }}
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-outline"
              style={{ padding: '10px 16px' }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
