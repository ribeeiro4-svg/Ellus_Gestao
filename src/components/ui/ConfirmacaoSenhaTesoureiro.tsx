'use client'
import { useState } from 'react'
import { Shield, X, Eye, EyeOff, Lock } from 'lucide-react'

interface ConfirmacaoSenhaTesoreiroProps {
  isOpen: boolean
  onClose: () => void
  onConfirmed: () => void
  titulo?: string
  descricao?: string
}

export function ConfirmacaoSenhaTesoureiro({
  isOpen,
  onClose,
  onConfirmed,
  titulo = 'Confirmação Obrigatória',
  descricao = 'Esta ação crítica requer a senha do Tesoureiro para prosseguir.',
}: ConfirmacaoSenhaTesoreiroProps) {
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const handleConfirmar = async () => {
    if (!senha.trim()) {
      setErro('Informe a senha do Tesoureiro.')
      return
    }

    setLoading(true)
    setErro('')

    try {
      const res = await fetch('/api/auth/verificar-senha-tesoureiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha }),
      })

      const data = await res.json()

      if (data.ok) {
        setSenha('')
        setErro('')
        onConfirmed()
      } else {
        setErro(data.erro || 'Senha incorreta.')
      }
    } catch {
      setErro('Erro ao verificar a senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSenha('')
    setErro('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Ação Protegida</p>
                <h2 className="text-base font-black text-white">{titulo}</h2>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">{descricao}</p>

          {/* Campo de senha */}
          <div className="mb-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Senha do Tesoureiro
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={14} />
              </div>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={e => { setSenha(e.target.value); setErro('') }}
                onKeyDown={e => e.key === 'Enter' && handleConfirmar()}
                placeholder="Digite a senha do Tesoureiro..."
                autoFocus
                className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all placeholder:text-slate-300"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {mostrarSenha ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {/* Erro */}
            {erro && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl">
                <span className="text-[11px] font-bold text-rose-600">{erro}</span>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={loading || !senha.trim()}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Shield size={12} />
                  Confirmar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
