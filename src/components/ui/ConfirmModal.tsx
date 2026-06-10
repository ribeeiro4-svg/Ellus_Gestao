'use client'
import React from 'react'
import { AlertCircle, X, CheckCircle2, AlertTriangle, Info } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: React.ReactNode
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'success' | 'info'
  loading?: boolean
  requirePassword?: boolean
  passwordValue?: string
  onPasswordChange?: (val: string) => void
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  loading = false,
  requirePassword = false,
  passwordValue = '',
  onPasswordChange
}: ConfirmModalProps) {
  if (!isOpen) return null

  const config = {
    danger: {
      icon: AlertCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
    },
    success: {
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      button: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
    },
    info: {
      icon: Info,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
    }
  }[type]

  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className={`w-16 h-16 rounded-2xl ${config.bg} ${config.border} border flex items-center justify-center ${config.color}`}>
              <Icon size={32} />
            </div>
          </div>

          <h3 className="text-xl font-black text-slate-800 text-center mb-2 tracking-tight">
            {title}
          </h3>
          <div className="text-slate-500 text-sm font-medium leading-relaxed text-center">
            {message}
          </div>

          {requirePassword && (
            <div className="mt-6">
              <input
                type="password"
                placeholder="Digite a senha para confirmar..."
                value={passwordValue}
                onChange={(e) => onPasswordChange?.(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all text-center"
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || (requirePassword && !passwordValue)}
            className={`flex-1 px-6 py-3.5 ${config.button} text-white rounded-2xl text-sm font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
