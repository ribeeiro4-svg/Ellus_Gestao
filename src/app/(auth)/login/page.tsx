'use client'
import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, Mail, Lock, AlertCircle, ShieldCheck } from 'lucide-react'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      })
      const data = await res.json()
      
      if (res.ok) {
        // Salvar permissões para controle de botões na UI
        if (data.permissoes) {
          localStorage.setItem('user_permissions', JSON.stringify(data.permissoes))
        }
        if (data.colaborador) {
          localStorage.setItem('user_profile', JSON.stringify({ id: data.colaborador.id, perfil_id: data.colaborador.perfil_id }))
        }
        if (data.token) {
          localStorage.setItem('rbac_token_raw', data.token)
        }
        
        // Redirecionar forçando reload para aplicar o novo cookie ao middleware
        window.location.href = '/'
      } else {
        setErro(data.erro || 'Credenciais inválidas.')
      }
    } catch (err: any) {
      setErro('Ocorreu um erro ao conectar ao servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#071a12] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'56\' height=\'100\'%3E%3Cpath d=\'M28 66L0 50V18L28 2l28 16v32L28 66z\' fill=\'none\' stroke=\'%232d8c6f\' stroke-width=\'0.8\'/%3E%3C/svg%3E")', backgroundSize: '56px 100px' }}></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(45,140,111,0.15)_0%,transparent_70%)] pointer-events-none"></div>

      <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-[24px] shadow-2xl p-10 relative overflow-hidden border border-white/10">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#2d8c6f]"></div>
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#2d8c6f]/5 text-[#2d8c6f] mb-6 shadow-sm border border-[#2d8c6f]/10">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-3xl font-bold text-[#0e2d22] tracking-tight">ACPROBEC</h2>
            <p className="text-[13px] text-slate-500 mt-2 font-medium">
              Acesso Corporativo Seguro
            </p>
          </div>

          {erro && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm animate-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0" />
              <p>{erro}</p>
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
                  placeholder="exemplo@acprobec.org"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-400 text-slate-700 font-medium"
                />
              </div>
            </div>

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

            <div className="flex items-center justify-between px-1 mb-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
                <span className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors font-medium">Lembrar acesso</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 mt-2 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
             <div className="flex items-center gap-3">
               <div className="w-8 h-[1px] bg-slate-100"></div>
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Suporte Técnico</span>
               <div className="w-8 h-[1px] bg-slate-100"></div>
             </div>
             <p className="text-[11px] text-slate-400 text-center leading-relaxed max-w-[240px]">
               Desenvolvido por <span className="text-slate-600 font-bold">ÁUREA Tech</span> para gestão de associações de excelência.
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#071a12] flex items-center justify-center p-6 text-white font-black uppercase tracking-widest animate-pulse">
        Carregando Segurança...
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
