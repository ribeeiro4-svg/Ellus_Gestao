
'use client'
import React, { useState, useEffect, useMemo } from 'react'
import ImportarTab from './ImportarTab'
import { 
  Settings, 
  CreditCard,
  Download, 
  Plus, 
  Trash2, 
  Pencil,
  Building2,
  Wallet,
  BookOpen,
  PieChart,
  LayoutDashboard,
  ChevronDown,
  ChevronUp,
  Link2,
  CheckSquare,
  Zap,
  Upload,
  Loader2,
  Shield,
  Users,
  Activity,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRightLeft,
  Search,
  ArrowUpDown
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useContas } from '@/lib/hooks/useContas'
import { useCategorias } from '@/lib/hooks/useCategorias'
import { useFinanceiro } from '@/lib/hooks/useFinanceiro'
import { fmtR } from '@/lib/utils/formatters'
import CrudModal from '@/components/ui/CrudModal'
import { useTenant } from '@/lib/hooks/useTenant'
import { useConfiguracoesContabeis } from '@/features/contabil/hooks/useConfiguracoesContabeis'
import ContaContabilSelect from '@/features/contabil/components/ContaContabilSelect'
import ConfigCobrancaTab from '@/features/cobranca/components/ConfigCobrancaTab'
import { usePermissions } from '@/lib/hooks/usePermissions'

type TabType = 'geral' | 'financeiro' | 'categorias' | 'cobranca' | 'acessos' | 'minha-conta' | 'importar'

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState<TabType>('geral')
  const { contas, loading: loadingContas, inserir: inserirConta, atualizar: atualizarConta, remover: removerConta } = useContas()
  const { categorias, loading: loadingCats, inserir: inserirCat, atualizar: atualizarCat, remover: removerCat } = useCategorias()
  const { lancamentos, atualizarBulk } = useFinanceiro()
  const { tenant, loading: loadingTenant, atualizar: atualizarTenant } = useTenant()
  const { configuracoes, salvarMapping, removerMapping } = useConfiguracoesContabeis()
  const { ver: podeVerConfig, isAdmin, loading: loadingPerms } = usePermissions('configuracoes')

  useEffect(() => {
    if (!loadingPerms && !podeVerConfig && !isAdmin) {
      setActiveTab('minha-conta')
    }
  }, [podeVerConfig, isAdmin, loadingPerms])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [isCatModalOpen, setIsCatModalOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<any>(null)
  const [transferCat, setTransferCat] = useState<any>(null)
  const [allExpanded, setAllExpanded] = useState(false)
  const [filtroBusca, setFiltroBusca] = useState('')
  const [sortColumn, setSortColumn] = useState<'nome' | 'terminologia' | 'uso'>('nome')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBatchMappingOpen, setIsBatchMappingOpen] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)

  // Minha Conta - Troca de Senha
  const [senhaAtual, setSenhaAtual] = useState('')
  const [senhaNova, setSenhaNova] = useState('')
  const [senhaConfirm, setSenhaConfirm] = useState('')
  const [showSenhaAtual, setShowSenhaAtual] = useState(false)
  const [showSenhaNova, setShowSenhaNova] = useState(false)
  const [showSenhaConfirm, setShowSenhaConfirm] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [msgSenha, setMsgSenha] = useState<{ tipo: 'ok' | 'erro', texto: string } | null>(null)

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

  const [uploading, setUploading] = useState(false)
  const sb = createClient()

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tenant?.id) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tenantId', tenant.id)

      const res = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro desconhecido na API')
      }

      const publicUrl = data.publicUrl
      setCustomLogo(publicUrl)
      
      const { error: saveError } = await atualizarTenant({ logo_url: publicUrl })
      if (saveError) {
        alert('Logo enviada, mas erro ao vincular ao seu cadastro: ' + saveError.message)
      } else {
        alert('Logo enviada e salva com sucesso!')
      }
    } catch (err: any) {
      alert('Erro no upload: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

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
    try {
      let res;
      if (editingItem) { 
        res = await atualizarConta(editingItem.id, {
          nome: data.nome,
          tipo: data.tipo,
          saldo_inicial: data.saldo_inicial
        }) 
      }
      else { 
        res = await inserirConta({
          nome: data.nome,
          tipo: data.tipo,
          saldo_inicial: data.saldo_inicial
        }) 
      }

      if (res?.error) {
        alert('Erro ao salvar conta: ' + (res.error as any).message)
        return
      }

      // Salvar Mapeamento se houver dados
      if (data.conta_contabil_codigo && data.conta_contabil_nome) {
        // Precisamos do ID da conta se for nova
        // Como o hook useContas não retorna o objeto criado, 
        // o ideal seria que fixBankAccountsAction já tivesse resolvido,
        // mas aqui permitimos sobrescrever ou definir manualmente.
        
        // Buscar a conta recém criada se necessário ou usar o editingItem.id
        const accountId = editingItem?.id
        if (accountId) {
          await salvarMapping(`banco_${accountId}`, data.conta_contabil_codigo, data.conta_contabil_nome, 'dispendio')
        }
      }
      
      setIsModalOpen(false)
    } catch (err) {
      alert('Erro ao processar salvamento da conta.')
    }
  }

  const handleSalvarCat = async (data: any) => {
    try {
      // Filtrar campos que não pertencem à tabela de categorias (vêm do select de mapeamento)
      const { conta_contabil_codigo, conta_contabil_nome, ...catData } = data

      let resCat;
      if (editingCat) resCat = await atualizarCat(editingCat.id, catData)
      else resCat = await inserirCat(catData)
      
      if (resCat?.error) {
        alert('Erro ao salvar categoria: ' + (resCat.error as any).message)
        return
      }

      // Salvar Mapeamento se houver dados (usando os campos extraídos)
      if (conta_contabil_codigo && conta_contabil_nome) {
        const mappingTipo = data.tipo === 'receita' ? 'ingresso' : 'dispendio'
        const resMap = await salvarMapping(data.nome, conta_contabil_codigo, conta_contabil_nome, mappingTipo)
        if (resMap.error) alert('Categoria salva, mas erro ao mapear conta: ' + resMap.error)
      }
      
      setIsCatModalOpen(false)
      setEditingCat(null)
    } catch (err) {
      alert('Erro de conexão ao salvar categoria.')
    }
  }

  const handleExcluirLote = async () => {
    if (!confirm(`Deseja excluir permanentemente ${selectedIds.length} categorias?`)) return
    
    for (const id of selectedIds) {
      await removerCat(id)
    }
    setSelectedIds([])
    alert('Exclusão em lote concluída.')
  }

  const handleBatchMapping = async (conta: any) => {
    for (const id of selectedIds) {
      const cat = categorias.find(c => c.id === id)
      if (cat) {
        await salvarMapping(cat.nome, conta.codigo, conta.descricao, cat.tipo === 'receita' ? 'ingresso' : 'dispendio')
      }
    }
    setSelectedIds([])
    setIsBatchMappingOpen(false)
    alert('Mapeamento em lote concluído.')
  }
  
  const handleMigrarPlano = async () => {
    if (!tenant?.id) return alert('Tenant não identificado.')
    
    const confirm1 = confirm('ATENÇÃO: Esta ação irá INATIVAR o plano de contas atual e criar um novo baseado no padrão ITG 2002. Lançamentos antigos precisarão ser reclassificados. Deseja continuar?')
    if (!confirm1) return

    const confirm2 = confirm('TEM CERTEZA? Esta é uma mudança estrutural profunda e os mapeamentos de categorias precisarão ser refeitos.')
    if (!confirm2) return
    
    setIsMigrating(true)
    try {
      const res = await fetch('/api/novo-plano-contas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id!,
          senha: 'MIGRAR_PLANO_2026'
        })
      })
      const data = await res.json()
      if (data.success) {
        alert('Migração concluída com sucesso! ' + data.stats.criadas + ' novas contas foram geradas.')
        window.location.reload()
      } else {
        alert('Erro na migração: ' + (data.error || 'Erro desconhecido'))
      }
    } catch (err) {
      alert('Erro de conexão ao migrar.')
    } finally {
      setIsMigrating(false)
    }
  }

  const sortedAndFilteredCategorias = useMemo(() => {
    let result = [...(categorias || [])];
    
    if (filtroBusca) {
      result = result.filter(c => c.nome.toLowerCase().includes(filtroBusca.toLowerCase()));
    }

    result.sort((a, b) => {
      let valA: any = a.nome;
      let valB: any = b.nome;

      if (sortColumn === 'terminologia') {
        const mapA = (configuracoes || []).find(c => c.categoria_nome === a.nome);
        const mapB = (configuracoes || []).find(c => c.categoria_nome === b.nome);
        valA = mapA ? mapA.conta_contabil_nome || '' : '';
        valB = mapB ? mapB.conta_contabil_nome || '' : '';
      } else if (sortColumn === 'uso') {
        valA = (lancamentos || []).filter(l => l.categoria === a.nome).length;
        valB = (lancamentos || []).filter(l => l.categoria === b.nome).length;
      } else {
        valA = a.nome;
        valB = b.nome;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [categorias, filtroBusca, sortColumn, sortDirection, configuracoes, lancamentos])

  if (loadingTenant && !tenant) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 py-20">
        <div className="w-12 h-12 border-4 border-[#2d8c6f]/20 border-t-[#2d8c6f] rounded-full animate-spin"></div>
        <p className="text-xs font-black text-[#2d8c6f] uppercase tracking-widest animate-pulse">Carregando Configurações...</p>
      </div>
    )
  }

  const allTabs = [
    { id: 'geral', label: 'Dados Gerais', icon: Building2 },
    { id: 'importar', label: 'Importar Dados', icon: Download },
    { id: 'financeiro', label: 'Contas Bancárias', icon: Wallet },
    { id: 'categorias', label: 'Categorias e Mapeamento', icon: BookOpen },
    { id: 'cobranca', label: 'Regras de Cobrança', icon: Zap },
    { id: 'acessos', label: 'Controle de Acessos', icon: Shield },
    { id: 'minha-conta', label: 'Minha Conta', icon: KeyRound },
  ]

  const tabs = (podeVerConfig || isAdmin) ? allTabs : allTabs.filter(t => t.id === 'minha-conta')

  const getActiveIcon = () => {
    const tab = tabs.find(t => t.id === activeTab)
    const Icon = (tab as any)?.icon || Settings
    return <Icon size={22} />
  }

  const handleSort = (column: 'nome' | 'terminologia' | 'uso') => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  return (
    <div className="flex flex-col flex-1 gap-3 animate-in fade-in duration-500 pb-20">
      {/* Header Centralizado - Estilo Hub Premium */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white/40 backdrop-blur-md py-3.5 px-6 rounded-2xl border border-white/60 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#0e2d22] flex items-center justify-center text-white shadow-lg shadow-emerald-900/20 transition-all duration-500">
            {getActiveIcon()}
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-tight">Painel de Configurações</h1>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest opacity-70 mt-1">Parâmetros e Automação — ACPROBEC</p>
          </div>
        </div>

        {/* Custom Tab Switcher - Premium Interaction */}
        <div className="bg-slate-100/60 p-1.5 rounded-[22px] flex flex-wrap items-center gap-1 border border-slate-200/40 backdrop-blur-sm shadow-inner">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-wider transition-all duration-500
                  ${isActive 
                    ? 'bg-white text-[#0e2d22] shadow-md border border-slate-200/50 scale-105' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}
                `}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === 'geral' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="table-card p-10 flex flex-col gap-8 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[2px] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Building2 size={18} />
              </div>
              Identidade Institucional
            </h2>
            
            <div className="flex flex-col flex-1 gap-6">
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
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logotipo Institucional</label>
                <div className="flex items-center gap-6 p-6 bg-slate-50/50 rounded-[24px] border border-slate-100 border-dashed hover:border-emerald-200 transition-all group">
                  <div className="w-20 h-20 rounded-[20px] bg-[#0A2618] border border-emerald-900/30 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-sm ring-4 ring-slate-100 group-hover:scale-105 transition-transform duration-500">
                    {customLogo ? (
                      <img src={customLogo} alt="Logo" className="w-full h-full object-contain scale-125" />
                    ) : (
                      <div className="text-2xl font-black text-slate-200 uppercase">AC</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold text-slate-400 max-w-[180px] leading-relaxed">
                      Recomendado: SVG ou PNG transparente (200x200px).
                    </p>
                    <label className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all
                      ${uploading ? 'bg-slate-100 text-slate-400' : 'bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white shadow-sm'}
                    `}>
                      {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {uploading ? 'Enviando...' : 'Fazer Upload de Logo'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleUploadLogo} 
                        disabled={uploading}
                        className="hidden" 
                      />
                    </label>
                  </div>
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
                className="mt-auto w-full h-14 bg-[#0e2d22] text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#163d2f] transition-all shadow-xl shadow-emerald-900/20 active:scale-95"
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

            <div className="flex flex-col flex-1 gap-6">
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
                className="mt-auto w-full h-14 bg-[#0e2d22] text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#163d2f] transition-all shadow-xl shadow-emerald-900/20 active:scale-95"
              >
                Atualizar Credenciais Bancárias
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'financeiro' && (
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
            {contas.map(conta => {
              const mapping = configuracoes.find(c => c.categoria_nome === `banco_${conta.id}`)
              
              return (
                <div key={conta.id} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 group hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-slate-50 group-hover:scale-110 transition-transform">
                      {conta.tipo === 'caixa_fisico' ? <Wallet size={24} /> : <Building2 size={24} />}
                    </div>
                    <div>
                      <div className="text-[13px] font-black text-slate-800 tracking-tight">{conta.nome}</div>
                      <div className="flex flex-col gap-0.5">
                        <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{conta.tipo.replace('_', ' ')}</div>
                        {mapping && (
                          <div className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1 w-fit mt-1 animate-in slide-in-from-left-2 duration-300">
                            <BookOpen size={10} />
                            {mapping.conta_contabil_codigo} — {mapping.conta_contabil_nome}
                          </div>
                        )}
                      </div>
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
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'categorias' && (
        <div className="table-card p-10 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[2px] flex items-center gap-3">
              <LayoutDashboard className="text-amber-500 w-5 h-5" />
              Gestão de Categorias e Mapeamento Contábil
            </h2>
            <div className="flex gap-3 items-center">
              <div className="relative group mr-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-amber-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Buscar categoria..." 
                  value={filtroBusca}
                  onChange={e => setFiltroBusca(e.target.value)}
                  className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-700 placeholder:text-slate-400 focus:ring-amber-500 focus:border-amber-500 w-56 uppercase tracking-widest transition-all"
                />
              </div>
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-3 bg-indigo-50 px-5 py-2 rounded-2xl border border-indigo-100 animate-in zoom-in-95 duration-200 mr-4">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mr-2 flex items-center gap-2">
                    <CheckSquare size={14} />
                    {selectedIds.length} Selecionados
                  </span>
                  <button 
                    onClick={() => setIsBatchMappingOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white text-[9px] font-black rounded-xl hover:bg-indigo-500 transition-all uppercase tracking-widest"
                  >
                    Vincular em Lote
                  </button>
                  <button 
                    onClick={handleExcluirLote}
                    className="px-4 py-2 bg-rose-100 text-rose-600 text-[9px] font-black rounded-xl hover:bg-rose-200 transition-all uppercase tracking-widest border border-rose-200"
                  >
                    Excluir em Lote
                  </button>
                </div>
              )}
              <button 
                onClick={() => setAllExpanded(!allExpanded)}
                className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-500 text-[10px] font-black rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest border border-slate-200"
              >
                {allExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {allExpanded ? 'Recolher Tudo' : 'Expandir Tudo'}
              </button>
              <button 
                onClick={async () => {
                  if (!tenant?.id) return alert('Tenant não identificado.');
                  if(!confirm('Deseja executar o Mapeamento Inteligente? Isso irá buscar vínculos automáticos para categorias não mapeadas ou com códigos antigos (5.x).')) return;
                  const { seedAccountingConfigAction } = await import('@/features/contabil/actions/seedAccountingConfig');
                  const res = await seedAccountingConfigAction(tenant.id!);
                  if (res.success) alert('Mapeamento Inteligente concluído!');
                  else alert('Erro: ' + res.error);
                  window.location.reload();
                }}
                className="px-6 py-3 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-xl hover:bg-emerald-200 transition-all uppercase tracking-widest border border-emerald-200 flex items-center gap-2"
              >
                <Zap size={14} /> Mapeamento Inteligente
              </button>
              <button 
                onClick={() => { setEditingCat(null); setIsCatModalOpen(true) }}
                className="px-6 py-3 bg-amber-500 text-white text-[10px] font-black rounded-xl hover:bg-amber-400 transition-all uppercase tracking-widest"
              >
                + Nova Categoria
              </button>
            </div>
          </div>

          <div className="overflow-hidden border border-slate-100 rounded-3xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4"
                      checked={selectedIds.length === categorias.length && categorias.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(categorias.map(c => c.id))
                        else setSelectedIds([])
                      }}
                    />
                  </th>
                  <th 
                    className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600 transition-colors"
                    onClick={() => handleSort('nome')}
                  >
                    <div className="flex items-center gap-2">
                      Categoria
                      <ArrowUpDown size={12} className={sortColumn === 'nome' ? 'text-amber-500' : 'text-slate-300'} />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600 transition-colors"
                    onClick={() => handleSort('terminologia')}
                  >
                    <div className="flex items-center gap-2">
                      Terminologia ITG 2002
                      <ArrowUpDown size={12} className={sortColumn === 'terminologia' ? 'text-amber-500' : 'text-slate-300'} />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600 transition-colors"
                    onClick={() => handleSort('uso')}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      Uso
                      <ArrowUpDown size={12} className={sortColumn === 'uso' ? 'text-amber-500' : 'text-slate-300'} />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedAndFilteredCategorias.map(cat => (
                  <CategoriaRow 
                    key={cat.id} 
                    cat={cat} 
                    lancamentosCount={(lancamentos || []).filter(l => l.categoria === cat.nome).length}
                    mapping={(configuracoes || []).find(c => c.categoria_nome === cat.nome)}
                    onEdit={() => { setEditingCat(cat); setIsCatModalOpen(true) }}
                    onDelete={() => confirm('Excluir esta categoria?') && removerCat(cat.id)}
                    onTransferir={() => setTransferCat(cat)}
                    onSaveMapping={salvarMapping}
                    onRemoveMapping={removerMapping}
                    allExpanded={allExpanded}
                    isSelected={selectedIds.includes(cat.id)}
                    onSelect={(checked: boolean) => {
                      if (checked) setSelectedIds(prev => [...prev, cat.id])
                      else setSelectedIds(prev => prev.filter(id => id !== cat.id))
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Seção de Manutenção - Migração do Plano de Contas */}
          <div className="mt-12 pt-12 border-t border-slate-100">
            <div className="bg-rose-50/50 p-8 rounded-[32px] border border-rose-100/50 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
                  <BookOpen size={28} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">Zona de Manutenção Crítica</h3>
                  <p className="text-[11px] text-slate-500 font-bold max-w-md">
                    Substituir o Plano de Contas atual pelo novo padrão **ITG 2002**. 
                    Esta ação é irreversível e inativará todas as contas contábeis cadastradas anteriormente.
                  </p>
                </div>
              </div>
              
              <button 
                onClick={handleMigrarPlano}
                disabled={isMigrating}
                className={`
                  px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg
                  ${isMigrating 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-200 active:scale-95'}
                `}
              >
                {isMigrating ? 'Migrando...' : '🚀 Migrar para Novo Plano ITG 2002'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cobranca' && (
        <ConfigCobrancaTab />
      )}

      {activeTab === 'acessos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <a href="/configuracoes/colaboradores" className="group p-8 bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <Users size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">Colaboradores</h3>
            <p className="text-sm text-slate-500 font-medium">Cadastre funcionários e gerencie os status de acesso à plataforma.</p>
          </a>
          
          <a href="/configuracoes/perfis" className="group p-8 bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <Shield size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">Perfis e Permissões</h3>
            <p className="text-sm text-slate-500 font-medium">Defina quais módulos cada cargo pode ver, criar, editar ou excluir.</p>
          </a>

          <a href="/auditoria" className="group p-8 bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <Activity size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">Log de Auditoria</h3>
            <p className="text-sm text-slate-500 font-medium">Histórico completo de segurança rastreando todas as ações por usuário e IP.</p>
          </a>
        </div>
      )}

      {activeTab === 'minha-conta' && (
        <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 p-10 flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                <KeyRound size={28} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Alterar Senha</h2>
                <p className="text-sm text-slate-400 font-medium mt-0.5">Mantenha sua conta segura com uma senha forte.</p>
              </div>
            </div>

            {msgSenha && (
              <div className={`flex items-center gap-3 p-4 rounded-2xl text-sm font-bold ${
                msgSenha.tipo === 'ok'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                {msgSenha.tipo === 'ok' ? <CheckCircle2 size={18} /> : <Shield size={18} />}
                {msgSenha.texto}
              </div>
            )}

            <div className="flex flex-col gap-5">
              {/* Senha Atual */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha Atual</label>
                <div className="relative">
                  <input
                    type={showSenhaAtual ? 'text' : 'password'}
                    value={senhaAtual}
                    onChange={e => setSenhaAtual(e.target.value)}
                    placeholder="Digite sua senha atual"
                    className="w-full h-12 px-5 pr-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500/30 transition-all outline-none"
                  />
                  <button type="button" onClick={() => setShowSenhaAtual(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showSenhaAtual ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Nova Senha */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nova Senha</label>
                <div className="relative">
                  <input
                    type={showSenhaNova ? 'text' : 'password'}
                    value={senhaNova}
                    onChange={e => setSenhaNova(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full h-12 px-5 pr-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500/30 transition-all outline-none"
                  />
                  <button type="button" onClick={() => setShowSenhaNova(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showSenhaNova ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {senhaNova.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                        senhaNova.length >= [6, 8, 10, 14][i]
                          ? ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500'][i]
                          : 'bg-slate-200'
                      }`} />
                    ))}
                  </div>
                )}
              </div>

              {/* Confirmar Nova Senha */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirmar Nova Senha</label>
                <div className="relative">
                  <input
                    type={showSenhaConfirm ? 'text' : 'password'}
                    value={senhaConfirm}
                    onChange={e => setSenhaConfirm(e.target.value)}
                    placeholder="Repita a nova senha"
                    className={`w-full h-12 px-5 pr-12 bg-slate-50 border rounded-2xl text-sm font-bold focus:bg-white transition-all outline-none ${
                      senhaConfirm && senhaNova !== senhaConfirm
                        ? 'border-red-300 focus:border-red-400'
                        : 'border-slate-100 focus:border-emerald-500/30'
                    }`}
                  />
                  <button type="button" onClick={() => setShowSenhaConfirm(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showSenhaConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {senhaConfirm && senhaNova !== senhaConfirm && (
                  <p className="text-[10px] text-red-500 font-bold">As senhas não coincidem.</p>
                )}
              </div>
            </div>

            <button
              onClick={async () => {
                setMsgSenha(null)
                if (!senhaAtual || !senhaNova || !senhaConfirm) {
                  setMsgSenha({ tipo: 'erro', texto: 'Preencha todos os campos.' })
                  return
                }
                if (senhaNova !== senhaConfirm) {
                  setMsgSenha({ tipo: 'erro', texto: 'As senhas novas não coincidem.' })
                  return
                }
                if (senhaNova.length < 6) {
                  setMsgSenha({ tipo: 'erro', texto: 'A nova senha deve ter no mínimo 6 caracteres.' })
                  return
                }

                setSalvandoSenha(true)
                try {
                  // Primeiro valida a senha atual fazendo login
                  const profileRaw = localStorage.getItem('user_profile')
                  const profile = profileRaw ? JSON.parse(profileRaw) : null
                  const tokenRaw = localStorage.getItem('rbac_token_raw') || ''

                  if (!profile?.id) {
                    setMsgSenha({ tipo: 'erro', texto: 'Sessão inválida. Faça login novamente.' })
                    return
                  }

                  const res = await fetch(`/api/colaboradores/${profile.id}/senha`, {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${tokenRaw}`
                    },
                    body: JSON.stringify({ senha_nova: senhaNova, senha_atual: senhaAtual })
                  })
                  const json = await res.json()
                  if (!res.ok || json.erro) {
                    setMsgSenha({ tipo: 'erro', texto: json.erro || 'Erro ao alterar a senha.' })
                  } else {
                    setMsgSenha({ tipo: 'ok', texto: 'Senha alterada com sucesso!' })
                    setSenhaAtual('')
                    setSenhaNova('')
                    setSenhaConfirm('')
                  }
                } catch (e: any) {
                  setMsgSenha({ tipo: 'erro', texto: 'Erro de conexão.' })
                } finally {
                  setSalvandoSenha(false)
                }
              }}
              disabled={salvandoSenha || !senhaAtual || !senhaNova || senhaNova !== senhaConfirm}
              className="w-full py-4 bg-[#0e2d22] hover:bg-slate-800 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-900/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {salvandoSenha ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
              {salvandoSenha ? 'Salvando...' : 'Alterar Senha'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'importar' && <ImportarTab />}


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
          { 
            name: 'mapeamento', 
            label: 'Mapeamento Contábil (Plano de Contas)', 
            type: 'info',
            render: (formData: any, handleChange: any) => (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  Vincular ao Plano de Contas
                </label>
                <ContaContabilSelect 
                  value={formData.conta_contabil_codigo}
                  currentLabel={formData.conta_contabil_nome}
                  tipo="despesa" // Bancos são ativos, mas o select mostra o plano
                  onChange={(item) => {
                    handleChange('conta_contabil_codigo', item.codigo)
                    handleChange('conta_contabil_nome', item.descricao)
                  }}
                />
              </div>
            )
          }
        ]}
        onLoad={(setFormData) => {
          if (editingItem) {
            const mapping = configuracoes.find(c => c.categoria_nome === `banco_${editingItem.id}`)
            if (mapping) {
              setFormData((prev: any) => ({
                ...prev,
                conta_contabil_codigo: mapping.conta_contabil_codigo,
                conta_contabil_nome: mapping.conta_contabil_nome
              }))
            }
          }
        }}
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
          { 
            name: 'mapeamento', 
            label: 'Mapeamento Contábil (Opcional)', 
            type: 'info',
            render: (formData: any, handleChange: any) => (
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  Vincular ao Plano de Contas
                </label>
                <ContaContabilSelect 
                  value={formData.conta_contabil_codigo}
                  currentLabel={formData.conta_contabil_nome}
                  tipo={formData.tipo === 'receita' ? 'ingresso' : 'despesa'}
                  onChange={(item) => {
                    handleChange('conta_contabil_codigo', item.codigo)
                    handleChange('conta_contabil_nome', item.descricao)
                  }}
                />
              </div>
            )
          }
        ]}
        onLoad={(setFormData) => {
          if (editingCat) {
            const mapping = configuracoes.find(c => c.categoria_nome === editingCat.nome)
            if (mapping) {
              setFormData((prev: any) => ({
                ...prev,
                conta_contabil_codigo: mapping.conta_contabil_codigo,
                conta_contabil_nome: mapping.conta_contabil_nome
              }))
            }
          }
        }}
      />
      <CrudModal 
        isOpen={isBatchMappingOpen}
        onClose={() => setIsBatchMappingOpen(false)}
        title="Vincular Contas em Lote"
        onSubmit={async (data) => {
          if (data.conta_contabil_codigo) {
            await handleBatchMapping({ codigo: data.conta_contabil_codigo, descricao: data.conta_contabil_nome })
          }
        }}
        fields={[
          {
            name: 'mapeamento',
            label: 'Selecione a Conta para Aplicar em Lote',
            type: 'info',
            render: (formData: any, handleChange: any) => (
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-500 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                  ⚠️ Esta ação aplicará a conta selecionada para as <strong>{selectedIds.length} categorias</strong> marcadas.
                </p>
                <ContaContabilSelect 
                  value={formData.conta_contabil_codigo}
                  currentLabel={formData.conta_contabil_nome}
                  tipo="ingresso" // Tipo aqui é flexível, o select mostra tudo
                  onChange={(item) => {
                    handleChange('conta_contabil_codigo', item.codigo)
                    handleChange('conta_contabil_nome', item.descricao)
                  }}
                />
              </div>
            )
          }
        ]}
      />
      <CrudModal 
        isOpen={!!transferCat}
        onClose={() => setTransferCat(null)}
        title={transferCat ? `Transferir Lançamentos de ${transferCat.nome}` : ''}
        onSubmit={async (data) => {
          if (transferCat) {
            const lancamentosToMove = lancamentos.filter(l => l.categoria === transferCat.nome)
            await atualizarBulk(lancamentosToMove.map(l => l.id), { categoria: data.nova_categoria })
            setTransferCat(null)
            alert('Lançamentos transferidos com sucesso!')
          }
        }}
        fields={transferCat ? [
          { 
            name: 'nova_categoria', 
            label: 'Nova Categoria de Destino', 
            type: 'select', 
            required: true, 
            options: categorias
              .filter(c => c.id !== transferCat.id && c.tipo === transferCat.tipo)
              .map(c => ({ value: c.nome, label: c.nome })) 
          }
        ] : []}
      />
    </div>
  )
}

function CategoriaRow({ cat, lancamentosCount, mapping, onEdit, onDelete, onTransferir, onSaveMapping, onRemoveMapping, allExpanded, isSelected, onSelect }: any) {
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    setIsExpanded(allExpanded)
  }, [allExpanded])

  return (
    <>
      <tr className={`group transition-all ${isSelected ? 'bg-amber-50/30' : 'hover:bg-slate-50/50'}`}>
        <td className="px-6 py-5">
          <input 
            type="checkbox" 
            className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
          />
        </td>
        <td className="px-6 py-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{cat.nome}</span>
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                  mapping 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                    : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                }`}
              >
                <Link2 size={10} />
                {mapping ? `Vínculo: ${mapping.conta_contabil_codigo}` : 'Vincular Conta Contábil'}
                <ChevronDown size={10} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </td>
        <td className="px-6 py-5">
          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
            cat.tipo === 'receita' 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
              : 'bg-rose-50 text-rose-600 border-rose-100'
          }`}>
            {cat.tipo === 'receita' ? 'Ingresso (Receita)' : 'Dispêndio (Despesa)'}
          </span>
        </td>
        <td className="px-6 py-5 text-center">
          <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${lancamentosCount > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
            {lancamentosCount} {lancamentosCount === 1 ? 'registro' : 'registros'}
          </span>
        </td>
        <td className="px-6 py-5 text-right">
          <div className="flex justify-end gap-1">
            {lancamentosCount > 0 && (
              <button onClick={onTransferir} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm border border-slate-100 bg-white" title="Transferir Lançamentos"><ArrowRightLeft size={14} /></button>
            )}
            <button onClick={onEdit} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm border border-slate-100 bg-white"><Pencil size={14} /></button>
            {lancamentosCount > 0 ? (
              <button onClick={() => alert('Não é possível excluir uma categoria que possui lançamentos vinculados. Transfira os lançamentos primeiro.')} className="w-9 h-9 flex items-center justify-center text-slate-300 cursor-not-allowed rounded-xl transition-all shadow-sm border border-slate-100 bg-white" title="Categoria em uso"><Trash2 size={14} /></button>
            ) : (
              <button onClick={onDelete} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm border border-slate-100 bg-white"><Trash2 size={14} /></button>
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-slate-50/50">
          <td colSpan={3} className="px-8 py-8 border-t border-slate-100 shadow-inner">
            <div className="flex flex-col gap-4 animate-in slide-in-from-top-4 duration-300">
               <div className="flex items-center justify-between mb-1">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                     <BookOpen size={16} />
                   </div>
                   <div>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Configuração de Integração Contábil</span>
                     <p className="text-[11px] text-slate-500 font-bold italic">Selecione a conta analítica do Plano de Contas ITG 2002 para esta categoria.</p>
                   </div>
                 </div>

                 {mapping && (
                   <button 
                    onClick={() => confirm('Remover este vínculo contábil?') && onRemoveMapping(mapping.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100"
                   >
                     <Trash2 size={12} />
                     Remover Vínculo
                   </button>
                 )}
               </div>
               
               <div className="max-w-2xl bg-white p-6 rounded-3xl border border-indigo-100/50 shadow-sm">
                 <ContaContabilSelect 
                    value={mapping?.conta_contabil_codigo}
                    currentLabel={mapping?.conta_contabil_nome}
                    tipo={cat.tipo === 'receita' ? 'ingresso' : 'despesa'}
                    onChange={(item) => onSaveMapping(cat.nome, item.codigo, item.descricao, cat.tipo === 'receita' ? 'ingresso' : 'dispendio')}
                  />
                  {mapping && (
                    <div className="mt-4 flex items-center gap-2 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/30">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                      <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                        Vinculado a: {mapping.conta_contabil_codigo} — {mapping.conta_contabil_nome}
                      </span>
                    </div>
                  )}
               </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
