'use client'

import { useState, useEffect } from 'react'

export function useRbacAuth() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('rbac_token')
    const u = localStorage.getItem('rbac_user')
    if (t && u) {
      setToken(t)
      setUser(JSON.parse(u))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, senha: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    })
    const data = await res.json()
    if (res.ok) {
      localStorage.setItem('rbac_token', data.token)
      localStorage.setItem('rbac_user', JSON.stringify(data.colaborador))
      setToken(data.token)
      setUser(data.colaborador)
      return { success: true }
    }
    return { success: false, error: data.erro }
  }

  const logout = () => {
    localStorage.removeItem('rbac_token')
    localStorage.removeItem('rbac_user')
    setToken(null)
    setUser(null)
  }

  return { token, user, loading, login, logout }
}

export function RbacLoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useRbacAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const res = await login(email, senha)
    if (res.success) {
      onLogin()
    } else {
      setErro(res.error || 'Erro no login')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-sm flex flex-col gap-4">
        <div className="text-center mb-4">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Acesso Interno</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Módulo RBAC de Colaboradores</p>
        </div>
        
        {erro && <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-xs font-bold text-center border border-rose-100">{erro}</div>}

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
        </label>
        
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha</span>
          <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
        </label>

        <button disabled={loading} className="mt-4 bg-slate-800 text-white font-black uppercase text-xs py-3 rounded-xl hover:bg-slate-700 disabled:opacity-50">
          {loading ? 'Acessando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
