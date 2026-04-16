'use client'
import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  Upload, 
  User, 
  Shield, 
  Save, 
  Trash2, 
  Globe,
  Camera
} from 'lucide-react'
import { fmtR } from '@/lib/utils/formatters'

export default function SettingsPage() {
  const [logo, setLogo] = useState<string | null>(null)
  const [userName, setUserName] = useState('Gestão Áurea')
  const [userEmail, setUserEmail] = useState('contato@aurea.com.br')
  const [isSaving, setIsSaving] = useState(false)

  // Load settings from localstorage on mount (simulating persistence)
  useEffect(() => {
    const savedLogo = localStorage.getItem('acprobec_custom_logo')
    if (savedLogo) setLogo(savedLogo)
    
    const savedName = localStorage.getItem('acprobec_user_name')
    if (savedName) setUserName(savedName)
  }, [])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setLogo(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const saveSettings = () => {
    setIsSaving(true)
    setTimeout(() => {
      if (logo) localStorage.setItem('acprobec_custom_logo', logo)
      localStorage.setItem('acprobec_user_name', userName)
      setIsSaving(false)
      alert('Configurações salvas com sucesso!')
      window.location.reload() // Reload to update sidebar in all tabs
    }, 1000)
  }

  const removeLogo = () => {
    setLogo(null)
    localStorage.removeItem('acprobec_custom_logo')
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      <div className="page-header mb-8">
        <div>
          <h1 className="page-title text-2xl font-bold text-gray-900 tracking-tight">Configurações do Perfil</h1>
          <p className="page-subtitle text-xs text-gray-500 mt-1 font-medium">Gerencie sua identidade visual e informações da conta.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Settings Menu */}
        <div className="lg:col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#0e2d22] text-white rounded-xl shadow-lg shadow-emerald-900/10 transition-all font-medium text-sm">
            <User size={18} />
            Perfil & Branding
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all font-medium text-sm">
            <Globe size={18} />
            Idioma & Região
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all font-medium text-sm">
            <Shield size={18} />
            Segurança
          </button>
        </div>

        {/* Content Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Internal Branding Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Settings size={18} />
              </div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Identidade Visual</h2>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 py-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-emerald-300">
                  {logo ? (
                    <img src={logo} alt="Custom Logo" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-gray-300 flex flex-col items-center">
                       <Camera size={24} />
                       <span className="text-[10px] mt-2 font-bold uppercase tracking-wider">Logo</span>
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#0e2d22] text-white flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                  <Upload size={14} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
              </div>

              <div className="flex-1 space-y-3">
                <h3 className="font-bold text-gray-900">Logo do Sistema</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Suba uma imagem (PNG ou SVG) de preferência com fundo transparente. 
                  Essa logo aparecerá na Sidebar e na tela de carregamento.
                </p>
                <div className="flex gap-2">
                   <button 
                     onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                     className="px-4 py-2 text-[11px] font-bold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors uppercase tracking-wider"
                    >
                     Escolher Foto
                   </button>
                   {logo && (
                     <button 
                       onClick={removeLogo}
                       className="px-4 py-2 text-[11px] font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors uppercase tracking-wider flex items-center gap-2"
                      >
                       <Trash2 size={12} />
                       Remover
                     </button>
                   )}
                </div>
              </div>
            </div>
          </div>

          {/* User Info Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <User size={18} />
              </div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Acesso & Nome</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Nome de Exibição</label>
                <input 
                  type="text" 
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="Nome do seu perfil"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">E-mail Administrativo</label>
                <input 
                  type="email" 
                  readOnly
                  value={userEmail}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-sm text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={saveSettings}
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-3 bg-[#0e2d22] text-white rounded-xl font-bold text-sm shadow-xl shadow-emerald-900/10 hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : <><Save size={18} /> Salvar Alterações</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
