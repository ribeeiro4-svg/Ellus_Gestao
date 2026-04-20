'use client'
import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  CreditCard, 
  Plus, 
  Trash2, 
  Pencil,
  Building2,
  Wallet
} from 'lucide-react'
import { useContas } from '@/lib/hooks/useContas'
import { useCategorias } from '@/lib/hooks/useCategorias'
import { fmtR } from '@/lib/utils/formatters'
import CrudModal from '@/components/ui/CrudModal'

import { useTenant } from '@/lib/hooks/useTenant'

export default function ConfigPage() {
  const { contas, loading: loadingContas, inserir: inserirConta, atualizar: atualizarConta, remover: removerConta } = useContas()
  const { categorias, loading: loadingCats, inserir: inserirCat, atualizar: atualizarCat, remover: removerCat } = useCategorias()
  const { tenant, loading: loadingTenant, atualizar: atualizarTenant } = useTenant()

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
      if (error) {
        console.error('[ConfigPage] Erro ao salvar:', error)
        alert(`Erro ao salvar no banco: ${error.message}`)
      } else {
        alert('Configurações salvas com sucesso!')
      }
    } catch (err: any) {
      console.error('[ConfigPage] Erro inesperado:', err)
      alert('Erro inesperado: ' + err.message)
    }
  }

  const handleSalvarConta = async (data: any) => {
    if (editingItem) { await atualizarConta(editingItem.id, data) }
    else { await inserirConta(data) }
  }

  const handleSalvarCat = async (data: any) => {
    try {
      let res;
      if (editingCat) { 
        res = await atualizarCat(editingCat.id, data) 
      } else { 
        res = await inserirCat(data) 
      }
      
      if (res?.error) {
        alert('Erro ao salvar categoria: ' + (res.error as any).message)
      } else {
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

  return (
    <div className="flex flex-col flex-1 gap-8 animate-in fade-in duration-500 pb-20">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Settings className="text-[#2d8c6f]" />
            Configurações
          </h1>
          <p className="page-subtitle text-xs text-gray-500 mt-1 font-medium italic">
            Gerencie suas contas bancárias, padronize categorias e configure integrações.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Perfil do Portal */}
        <div className="table-card p-6 flex flex-col gap-6">
          <h2 className="text-sm font-bold text-gray-400 font-sans uppercase tracking-[2px] flex items-center gap-2">
            <Building2 className="text-[#2d8c6f] w-4 h-4" />
            Identidade e Integrações
          </h2>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-gray-600 uppercase">Nome da Instituição</label>
              <input 
                type="text" 
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ex: ACPROBEC Gestão"
                className="w-full h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-[#2d8c6f]/30 transition-all outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-gray-600 uppercase">URL do Logotipo</label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={customLogo}
                  onChange={(e) => setCustomLogo(e.target.value)}
                  placeholder="https://exemplo.com/logo.png"
                  className="flex-1 h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-[#2d8c6f]/30 transition-all outline-none"
                />
                {customLogo && (
                  <div className="w-11 h-11 rounded-xl bg-white border border-gray-100 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    <img src={customLogo} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col gap-4">
              <label className="text-[11px] font-bold text-indigo-600 uppercase flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                Integração ZapSign
              </label>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Token da API</label>
                <input 
                  type="password" 
                  value={zapsignToken}
                  onChange={(e) => setZapsignToken(e.target.value)}
                  placeholder="Seu token ZapSign..."
                  className="w-full h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-indigo-400/30 transition-all outline-none font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col gap-4">
              <label className="text-[11px] font-bold text-emerald-600 uppercase flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Integração Cora (mTLS)
              </label>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Client ID (ID)</label>
                <input 
                  type="text" 
                  value={coraId}
                  onChange={(e) => setCoraId(e.target.value)}
                  placeholder="int-..."
                  className="w-full h-11 px-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:bg-white focus:border-emerald-400/30 transition-all outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Certificado (.cert)</label>
                  <textarea 
                    value={coraCert}
                    onChange={(e) => setCoraCert(e.target.value)}
                    placeholder="-----BEGIN CERTIFICATE-----"
                    className="w-full h-24 p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] focus:bg-white focus:border-emerald-400/30 transition-all outline-none font-mono resize-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Chave Privada (.key)</label>
                  <textarea 
                    value={coraKey}
                    onChange={(e) => setCoraKey(e.target.value)}
                    placeholder="-----BEGIN RSA PRIVATE KEY-----"
                    className="w-full h-24 p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] focus:bg-white focus:border-emerald-400/30 transition-all outline-none font-mono resize-none"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleSavePerfil}
              disabled={loadingTenant}
              className="mt-2 w-full h-11 bg-[#2d8c6f] text-white text-[11px] font-black uppercase rounded-xl hover:shadow-lg hover:shadow-emerald-900/10 transition-all active:scale-95 disabled:opacity-50"
            >
              {loadingTenant ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Contas Bancárias */}
          <div className="table-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold text-gray-400 font-sans uppercase tracking-[2px] flex items-center gap-2">
                <CreditCard className="text-[#2d8c6f] w-4 h-4" />
                Contas Bancárias
              </h2>
              <button 
                onClick={() => { setEditingItem(null); setIsModalOpen(true) }}
                className="px-4 py-2 bg-[#2d8c6f] text-white text-[10px] font-bold rounded-xl hover:bg-[#246d56] transition-all uppercase shadow-sm"
              >
                + Nova Conta
              </button>
            </div>

            <div className="space-y-4">
              {contas.map(conta => (
                <div key={conta.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#2d8c6f] shadow-sm">
                      {conta.tipo === 'caixa_fisico' ? <Wallet size={20} /> : <Building2 size={20} />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-800">{conta.nome}</div>
                      <div className="text-[10px] text-gray-400 uppercase font-black">{conta.tipo.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Saldo Inicial</div>
                      <div className="text-sm font-black text-gray-700">{fmtR(conta.saldo_inicial)}</div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingItem(conta); setIsModalOpen(true) }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => confirm('Excluir esta conta?') && removerConta(conta.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
              {contas.length === 0 && !loadingContas && (
                <div className="text-center py-8 text-gray-400 text-xs italic">Nenhuma conta cadastrada.</div>
              )}
              {loadingContas && (
                <div className="text-center py-8 text-gray-300 animate-pulse text-[10px] uppercase font-bold italic">Carregando contas...</div>
              )}
            </div>
          </div>

          {/* Categorias Padronizadas */}
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-amber-200 to-transparent"></div>
            
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-3">
                <Plus className="text-amber-500 w-5 h-5" strokeWidth={3} />
                Categorias Padronizadas
              </h2>
              <button 
                onClick={() => { setEditingCat(null); setIsCatModalOpen(true) }}
                className="px-8 py-4 bg-[#f39c12] hover:bg-[#e67e22] text-white text-[11px] font-black rounded-2xl transition-all uppercase tracking-widest shadow-lg shadow-orange-100 active:scale-95"
              >
                + Nova Categoria
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categorias.map(cat => (
                <div 
                  key={cat.id} 
                  className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[24px] border border-slate-100 group hover:bg-white hover:border-amber-200 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => { setEditingCat(cat); setIsCatModalOpen(true) }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full shadow-sm ${cat.tipo === 'receita' ? 'bg-[#2ecc71] ring-4 ring-emerald-50' : 'bg-[#e91e63] ring-4 ring-rose-50'}`}></div>
                    <span className="text-[12px] font-black text-slate-700 uppercase tracking-tighter">{cat.nome}</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); confirm('Excluir esta categoria?') && removerCat(cat.id) }} 
                      className="w-10 h-10 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              
              {categorias.length === 0 && !loadingCats && (
                <div className="col-span-2 py-16 text-center">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Plus size={32} />
                   </div>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Nenhuma categoria cadastrada</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
          { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: [
            { value: 'receita', label: 'Receita' },
            { value: 'despesa', label: 'Despesa' },
          ]},
        ]}
      />
    </div>
  )
}
