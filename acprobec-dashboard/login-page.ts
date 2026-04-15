'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [senha, setSenha]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [erro, setErro]         = useState('')
  const router = useRouter()
  const sb     = createClient()

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const { error } = await sb.auth.signInWithPassword({ email, password: senha })
    if (error) { setErro('Email ou senha incorretos.'); setLoading(false); return }
    router.push('/')
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--navy)', display: 'flex',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 16, padding: 40,
        width: 380, boxShadow: '0 20px 60px rgba(0,0,0,.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text1)' }}>ACPROBEC</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
            Dashboard Financeiro · INOVACONT
          </div>
        </div>

        {erro && (
          <div className="alert alert-danger" style={{ marginBottom: 20 }}>
            {erro}
          </div>
        )}

        <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              style={{
                width: '100%', padding: '10px 14px', border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 13, fontFamily: 'inherit', color: 'var(--text1)',
                background: 'var(--surface2)', outline: 'none'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
              Senha
            </label>
            <input
              type="password" required value={senha} onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 14px', border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 13, fontFamily: 'inherit', color: 'var(--text1)',
                background: 'var(--surface2)', outline: 'none'
              }}
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '11px', fontSize: 14, marginTop: 4, justifyContent: 'center' }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 20 }}>
          Problemas para acessar? Contate o administrador.
        </p>
      </div>
    </div>
  )
}
