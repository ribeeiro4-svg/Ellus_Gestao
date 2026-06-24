'use client'
import React, { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ShieldOff, ArrowLeft, UserX } from 'lucide-react'

function AcessoNegadoContent() {
  const params = useSearchParams()
  const router = useRouter()
  const reason = params?.get('reason')
  const isNoProfile = reason === 'no-profile'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl ${
            isNoProfile ? 'bg-amber-100' : 'bg-rose-100'
          }`}>
            {isNoProfile
              ? <UserX size={48} className="text-amber-500" />
              : <ShieldOff size={48} className="text-rose-500" />
            }
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
          {isNoProfile ? 'Perfil não configurado' : 'Acesso Negado'}
        </h1>

        {/* Message */}
        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
          {isNoProfile
            ? 'Seu usuário ainda não tem um perfil de acesso configurado neste sistema. Entre em contato com o administrador para que ele possa definir suas permissões.'
            : 'Você não tem permissão para acessar esta área do sistema. Se acredita que isso é um erro, entre em contato com o administrador.'}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition-all"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
          <button
            onClick={() => router.push('/resumo')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition-all shadow-sm"
          >
            Ir ao Dashboard
          </button>
        </div>

        {/* Footer hint */}
        <p className="mt-10 text-xs text-slate-300 font-medium">
          InovacontACPROBEC · Sistema de Controle de Acesso
        </p>
      </div>
    </div>
  )
}

export default function AcessoNegadoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    }>
      <AcessoNegadoContent />
    </Suspense>
  )
}
