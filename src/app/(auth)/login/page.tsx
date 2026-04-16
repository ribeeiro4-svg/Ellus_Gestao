'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogIn, Mail, Lock, AlertCircle, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [view, setView] = useState<'login' | 'signup' | 'reset'>('login')
  const router = useRouter()
  const sb = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro('')
    setSucesso('')

    try {
      if (view === 'login') {
        const { error } = await sb.auth.signInWithPassword({ email, password: senha })
        if (error) throw error
        router.push('/')
      } else if (view === 'signup') {
        const { error } = await sb.auth.signUp({ 
          email, 
          password: senha,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        })
        if (error) throw error
        setSucesso('Conta criada! Verifique seu e-mail para confirmar o acesso.')
        setView('login')
      } else if (view === 'reset') {
        const { error } = await sb.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        })
        if (error) throw error
        setSucesso('E-mail de recuperação enviado!')
        setView('login')
      }
    } catch (err: any) {
      setErro(err.message || 'Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const loginGoogle = async () => {
    setGoogleLoading(true)
    setErro('')
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setErro('Erro ao autenticar com Google. Tente novamente.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.1),transparent),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.05),transparent)] font-sans">
      <div className="w-full max-w-[420px] animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-[24px] shadow-2xl p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-6 shadow-sm border border-blue-100">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">ACPROBEC</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              {view === 'login' && 'Bem-vindo de volta! Faça seu login.'}
              {view === 'signup' && 'Crie sua conta gratuita agora.'}
              {view === 'reset' && 'Recupere seu acesso ao sistema.'}
            </p>
          </div>

          {erro && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm animate-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0" />
              <p>{erro}</p>
            </div>
          )}

          {sucesso && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-700 text-sm animate-in slide-in-from-top-2">
              <ShieldCheck size={18} className="shrink-0" />
              <p>{sucesso}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                E-mail Institucional
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="exemplo@acprobec.com.br"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-400 text-slate-700 font-medium"
                />
              </div>
            </div>

            {view !== 'reset' && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Senha de Acesso
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    type="password"
                    required
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-400 text-slate-700"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between px-1">
              {view === 'login' ? (
                <>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
                    <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors font-medium">Lembrar acesso</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setView('reset')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </>
              ) : (
                <button 
                  type="button" 
                  onClick={() => setView('login')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Voltar para o Login
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 mt-2 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  <span>
                    {view === 'login' && 'Entrar no Sistema'}
                    {view === 'signup' && 'Criar minha Conta'}
                    {view === 'reset' && 'Enviar Recuperação'}
                  </span>
                </>
              )}
            </button>

            {view === 'login' && (
              <>
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-[1px] bg-slate-100"></div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ou</span>
                  <div className="flex-1 h-[1px] bg-slate-100"></div>
                </div>

                <button
                  type="button"
                  onClick={loginGoogle}
                  disabled={loading || googleLoading}
                  className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-sm mb-4"
                >
                  {googleLoading ? (
                    <div className="w-5 h-5 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      <span className="text-sm">Entrar com Google</span>
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button 
                    type="button" 
                    onClick={() => setView('signup')}
                    className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    Ainda não tem conta? <span className="text-blue-600">Cadastre-se grátis</span>
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
             <div className="flex items-center gap-3">
               <div className="w-8 h-[1px] bg-slate-100"></div>
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Suporte Técnico</span>
               <div className="w-8 h-[1px] bg-slate-100"></div>
             </div>
             <p className="text-[11px] text-slate-400 text-center leading-relaxed max-w-[240px]">
               Desenvolvido por <span className="text-slate-600 font-bold">INOVACONT</span> para gestão de associações de excelência.
             </p>
          </div>
        </div>
        
        <p className="text-center mt-8 text-slate-500 text-[11px]">
          &copy; {new Date().getFullYear()} ACPROBEC. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
