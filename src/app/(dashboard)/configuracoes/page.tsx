'use client'
import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  CreditCard, 
  Plus, 
  Trash2, 
  Pencil,
  Building2,
  Wallet,
  BookOpen,
  PieChart,
  LayoutDashboard
} from 'lucide-react'
import { useContas } from '@/lib/hooks/useContas'
import { useCategorias } from '@/lib/hooks/useCategorias'
import { fmtR } from '@/lib/utils/formatters'
import CrudModal from '@/components/ui/CrudModal'
import { useTenant } from '@/lib/hooks/useTenant'
import { useConfiguracoesContabeis } from '@/features/contabil/hooks/useConfiguracoesContabeis'
import ContaContabilSelect from '@/features/contabil/components/ContaContabilSelect'

type TabType = 'geral' | 'financeiro' | 'contabil'

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState<TabType>('geral')
  const { contas, loading: loadingContas, inserir: inserirConta, atualizar: atualizarConta, remover: removerConta } = useContas()
  const { categorias, loading: loadingCats, inserir: inserirCat, atualizar: atualizarCat, remover: removerCat } = useCategorias()
  const { tenant, loading: loadingTenant, atualizar: atualizarTenant } = useTenant()
  const { configuracoes, salvarMapping } = useConfiguracoesContabeis()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [isCatModalOpen, setIsCatModalOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<any>(null)

  // Perfil State
  const [customName, setCustomName] = useState('')
  const [customLogo, setCustomLogo] = useState('')
  const [zapsignToken, setZapsignToken] = useState('')
  const [coraId, setCoraId] = useState('')
  const [coraCert, setCoraCert] = useState('')
  const [coraKey, setCoraKey] = useState('')

  useEffect(() => {
    if (tenant) {
      setCustomName(tenant.nome || '')
      setCustomLogo(tenant.logo_url || '')
      setZapsignToken(tenant.zapsign_token || '')
      setCoraId(tenant.cora_id || '')
      setCoraCert(tenant.cora_cert || '')
      setCoraKey(tenant.cora_key || '')
    }
  }, [tenant])

  const handleSavePerfil = async () => {
    try {
      const { error } = await atualizarTenant({ 
        nome: customName, 
        logo_url: customLogo, 
        zapsign_token: zapsignToken,
        cora_id: coraId,
        cora_cert: coraCert,
        cora_key: coraKey
      })
      if (error) alert(`Erro ao salvar no banco: ${error.message}`)
      else alert('Configurações salvas com sucesso!')
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message)
    }
  }

  const handleSalvarConta = async (data: any) => {
    if (editingItem) { await atualizarConta(editingItem.id, data) }
    else { await inserirConta(data) }
    setIsModalOpen(false)
  }

  const handleSalvarCat = async (data: any) => {
    try {
      let res;
      if (editingCat) res = await atualizarCat(editingCat.id, data)
      else res = await inserirCat(data)
      
      if (res?.error) alert('Erro ao salvar categoria: ' + (res.error as any).message)
      else {
        setIsCatModalOpen(false)
        setEditingCat(null)
      }
    } catch (err) {
      alert('Erro de conexão ao salvar categoria.')
    }
  }

  if (loadingTenant && !tenant) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 py-20">
        <div className="w-12 h-12 border-4 border-[#2d8c6f]/20 border-t-[#2d8c6f] rounded-full animate-spin"></div>
        <p className="text-xs font-black text-[#2d8c6f] uppercase tracking-widest animate-pulse">Carregando Configurações...</p>
      </div>
    )
  }

  const tabs = [
    { id: 'geral', label: 'Dados Gerais', icon: Building2 },
    { id: 'financeiro', label: 'Gestão Financeira', icon: Wallet },
    { id: 'contabil', label: 'Mapeamento Contábil', icon: BookOpen },
  ]

  return (
    <div className="flex flex-col flex-1 gap-8 animate-in fade-in duration-500 pb-20">
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40 backdrop-blur-md p-8 rounded-[32px] border border-white shadow-sm">
        <div>
          <h1 className="page-title text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Settings size={20} />
            </div>
            Painel de Configurações
          </h1>
          <p className="page-subtitle text-sm text-slate-500 mt-1 font-bold italic opacity-70">
            Ajuste os parâmetros da ACPROBEC e automatize sua contabilidade.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'geral' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="table-card p-10 flex flex-col gap-8 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[2px] flex items-center gap-3">
              <Building2 className="text-emerald-600 w-5 h-5" />
              Identidade Institucional
            </h2>
            
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome da Associação</label>
                <input 
                  type="text" 
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ex: ACPROBEC Nacional"
                  className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500/30 transition-all outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logotipo (URL)</label>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={customLogo}
                    onChange={(e) => setCustomLogo(e.target.value)}
                    placeholder="https://sua-logo.com/img.png"
                    className="flex-1 h-12 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500/30 transition-all outline-none"
                  />
                  {customLogo && (
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-sm ring-4 ring-slate-50">
                      <img src={customLogo} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 space-y-6">
                <label className="text-[11px] font-black text-indigo-600 uppercase flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-lg shadow-indigo-200"></div>
                  Integração ZapSign (Contratos)
                </label>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Token Secreto da API</label>
                  <input 
                    type="password" 
                    value={zapsignToken}
                    onChange={(e) => setZapsignToken(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-mono focus:bg-white focus:border-indigo-400/30 transition-all outline-none"
                  />
                </div>
              </div>

              <button 
                onClick={handleSavePerfil}
                className="mt-4 w-full h-14 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
              >
                Salvar Dados Institucionais
              </button>
            </div>
          </div>

          <div className="table-card p-10 flex flex-col gap-8 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[2px] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <PieChart size={18} />
              </div>
              Integração Bancária Cora (mTLS)
            </h2>

            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Client ID</label>
                <input 
                  type="text" 
                  value={coraId}
                  onChange={(e) => setCoraId(e.target.value)}
                  placeholder="int-..."
                  className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-mono focus:bg-white focus:border-emerald-400/30 transition-all outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Certificado Público (.cert)</label>
                <textarea 
                  value={coraCert}
                  onChange={(e) => setCoraCert(e.target.value)}
                  placeholder="-----BEGIN CERTIFICATE-----"
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-mono focus:bg-white focus:border-emerald-400/30 transition-all outline-none resize-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Chave Privada (.key)</label>
                <textarea 
                  value={coraKey}
                  onChange={(e) => setCoraKey(e.target.value)}
                  placeholder="-----BEGIN RSA PRIVATE KEY-----"
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-mono focus:bg-white focus:border-emerald-400/30 transition-all outline-none resize-none"
                />
              </div>

              <button 
                onClick={handleSavePerfil}
                className="w-full h-14 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-100 active:scale-95"
              >
                Atualizar Credenciais Bancárias
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'financeiro' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="table-card p-10 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[2px] flex items-center gap-3">
                <CreditCard className="text-emerald-600 w-5 h-5" />
                Contas Bancárias
              </h2>
              <button 
                onClick={() => { setEditingItem(null); setIsModalOpen(true) }}
                className="px-6 py-3 bg-emerald-600 text-white text-[10px] font-black rounded-xl hover:bg-emerald-500 transition-all uppercase tracking-widest"
              >
                + Nova Conta
              </button>
            </div>

            <div className="space-y-4">
              {contas.map(conta => (
                <div key={conta.id} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 group hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-slate-50 group-hover:scale-110 transition-transform">
                      {conta.tipo === 'caixa_fisico' ? <Wallet size={24} /> : <Building2 size={24} />}
                    </div>
                    <div>
                      <div className="text-[13px] font-black text-slate-800 tracking-tight">{conta.nome}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{conta.tipo.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Saldo Inicial</div>
                      <div className="text-sm font-black text-slate-700">{fmtR(conta.saldo_inicial)}</div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingItem(conta); setIsModalOpen(true) }} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Pencil size={14} /></button>
                      <button onClick={() => confirm('Excluir esta conta?') && removerConta(conta.id)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="table-card p-10 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[2px] flex items-center gap-3">
                <LayoutDashboard className="text-amber-500 w-5 h-5" />
                Categorias (ITG 2002)
              </h2>
              <button 
                onClick={() => { setEditingCat(null); setIsCatModalOpen(true) }}
                className="px-6 py-3 bg-amber-500 text-white text-[10px] font-black rounded-xl hover:bg-amber-400 transition-all uppercase tracking-widest"
              >
                + Nova Categoria
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categorias.map(cat => (
                <div 
                  key={cat.id} 
                  className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:bg-white hover:border-amber-200 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => { setEditingCat(cat); setIsCatModalOpen(true) }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${cat.tipo === 'receita' ? 'bg-emerald-500 ring-4 ring-emerald-50' : 'bg-rose-500 ring-4 ring-rose-50'}`}></div>
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{cat.nome}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); confirm('Excluir esta categoria?') && removerCat(cat.id) }} 
                    className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'contabil' && (
        <div className="table-card p-10 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-5 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
              <BookOpen size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Mapeamento de Contas ITG 2002</h2>
              <p className="text-sm text-slate-500 font-bold opacity-70">Vincule suas categorias financeiras às contas do livro contábil.</p>
            </div>
          </div>

          <div className="space-y-6">
            {categorias.map(cat => {
              const mapping = configuracoes.find(c => c.categoria_nome === cat.nome)
              return (
                <div key={cat.id} className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8 p-8 bg-slate-50/50 rounded-[32px] border border-slate-100 hover:bg-white hover:border-indigo-100 hover:shadow-lg transition-all">
                  <div className="lg:col-span-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${cat.tipo === 'receita' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{cat.nome}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">{cat.tipo === 'receita' ? 'Ingresso' : 'Dispêndio'}</div>
                  </div>

                  <div className="lg:col-span-1 flex justify-center">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                      <Plus size={14} strokeWidth={3} />
                    </div>
                  </div>

                  <div className="lg:col-span-8">
                   <ContaContabilSelect 
                      value={mapping?.conta_contabil_codigo}
                      currentLabel={mapping?.conta_contabil_nome}
                      tipo={cat.tipo === 'receita' ? 'ingresso' : 'dispesa'}
                      onChange={(item) => salvarMapping(cat.nome, item.codigo, item.descricao, cat.tipo === 'receita' ? 'ingresso' : 'dispendio')}
                    />
                    {mapping && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                          Vinculado a: {mapping.conta_contabil_codigo} — {mapping.conta_contabil_nome}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <CrudModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Conta' : 'Cadastrar Conta Bancária'}
        initialData={editingItem}
        onSubmit={handleSalvarConta}
        fields={[
          { name: 'nome', label: 'Nome da Conta', type: 'text', required: true, placeholder: 'Ex: Cora ACPROBEC, Bradesco...' },
          { name: 'tipo', label: 'Tipo de Conta', type: 'select', required: true, options: [
            { value: 'corrente', label: 'Conta Corrente' },
            { value: 'poupanca', label: 'Conta Poupança' },
            { value: 'caixa_fisico', label: 'Caixa Físico' },
          ]},
          { name: 'saldo_inicial', label: 'Saldo Inicial (R$)', type: 'number', required: true, defaultValue: 0 },
        ]}
      />

      <CrudModal 
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={editingCat ? 'Editar Categoria' : 'Nova Categoria Padronizada'}
        initialData={editingCat}
        onSubmit={handleSalvarCat}
        fields={[
          { name: 'nome', label: 'Nome da Categoria', type: 'text', required: true, placeholder: 'Ex: Mensalidades, Aluguel...' },
          { name: 'tipo', label: 'Tipo (Terminologia ITG 2002)', type: 'select', required: true, options: [
            { value: 'receita', label: 'Ingresso (Receita)' },
            { value: 'despesa', label: 'Dispêndio (Despesa)' },
          ]},
        ]}
      />
    </div>
  )
}
