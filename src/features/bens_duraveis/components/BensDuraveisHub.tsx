'use client'
import React, { useState, useEffect } from 'react'
import { Plus, Briefcase, Calendar, AlertTriangle, CheckCircle2, MoreVertical, Search, Wrench, FileText, Trash2, Printer, X, Package } from 'lucide-react'
import { useBensDuraveis, BemDuravel, Manutencao } from '../hooks/useBensDuraveis'
import FixedAssetsReports from './FixedAssetsReports'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from '@/lib/hooks/useTenantId'
import { useFornecedores } from '@/lib/hooks/useFornecedores'
import { abrirDanfeInterno, abrirDanfseInterno } from '@/lib/utils/abrirDanfe'
import { usePermissions } from '@/lib/hooks/usePermissions'

type Props = {
  tenantId: string | null
}

export default function BensDuraveisHub({ tenantId: initialTenantId }: Props) {
  const resolvedTenantId = useTenantId()
  const tenantId = initialTenantId || resolvedTenantId
  const { criar, editar, excluir, isAdmin } = usePermissions('bens_duraveis')
  
  const { 
    bens, 
    manutencoes, 
    todasManutencoes,
    loading, 
    carregarBens, 
    atualizarBem, 
    carregarManutencoes, 
    carregarTodasManutencoes,
    adicionarManutencao, 
    excluirManutencao, 
    excluirBem 
  } = useBensDuraveis(tenantId)
  const [activeTab, setActiveTab] = useState<'pendentes' | 'ativos'>('ativos')
  const [syncing, setSyncing] = useState(false)
  const sb = createClient()
  const { fornecedores } = useFornecedores()
  
  // Modals
  const [bemSelecionado, setBemSelecionado] = useState<BemDuravel | null>(null)
  const [showCadastroModal, setShowCadastroModal] = useState(false)
  const [showManutencaoModal, setShowManutencaoModal] = useState(false)
  const [showReports, setShowReports] = useState(false)

  // Form states
  const [vidaUtil, setVidaUtil] = useState('')
  const [obs, setObs] = useState('')
  const [manuData, setManuData] = useState('')
  const [manuTipo, setManuTipo] = useState<'preventiva'|'corretiva'|'ocorrencia'>('ocorrencia')
  const [manuDesc, setManuDesc] = useState('')
  const [manuCusto, setManuCusto] = useState('')
  const [manuPrestadorId, setManuPrestadorId] = useState('')
  const [manuNfeId, setManuNfeId] = useState('')
  const [listaNfes, setListaNfes] = useState<any[]>([])
  const [loadingNfes, setLoadingNfes] = useState(false)
  const [selectedManutencao, setSelectedManutencao] = useState<any | null>(null)
  const [showDetalhesModal, setShowDetalhesModal] = useState(false)

  useEffect(() => {
    if (tenantId) carregarBens()
  }, [tenantId, carregarBens])

  const carregarNfes = async () => {
    if (!tenantId) return
    setLoadingNfes(true)
    
    // Buscar NFe (Produtos)
    const { data: nfes } = await sb.from('nfe_entradas')
      .select('id, numero_nf, nome_emitente, data_emissao')
      .eq('tenant_id', tenantId)
      .order('data_emissao', { ascending: false })
      .limit(50)

    // Buscar NFSe (Serviços)
    const { data: nfses } = await sb.from('nfse_entradas')
      .select('id, numero_nfse, data_emissao, prestador:prestador_id(nome)')
      .eq('tenant_id', tenantId)
      .order('data_emissao', { ascending: false })
      .limit(50)

    const unificadas = [
      ...(nfes || []).map(n => ({ ...n, tipo: 'nfe', display: `NFe ${n.numero_nf} - ${n.nome_emitente}` })),
      ...(nfses || []).map(n => ({ ...n, tipo: 'nfse', display: `NFSe ${n.numero_nfse} - ${(n as any).prestador?.nome || 'N/I'}` }))
    ].sort((a, b) => new Date(b.data_emissao).getTime() - new Date(a.data_emissao).getTime())

    setListaNfes(unificadas)
    setLoadingNfes(false)
  }

  const pendentes = bens.filter(b => b.status === 'pendente_analise')
  const ativos = bens.filter(b => b.status === 'ativo')

  const handleFinalizarCadastro = async () => {
    if (!bemSelecionado || !vidaUtil) return
    const res = await atualizarBem(bemSelecionado.id, {
      status: 'ativo',
      vida_util_meses: parseInt(vidaUtil),
      observacoes: obs || bemSelecionado.observacoes
    })
    if (res.success) {
      setShowCadastroModal(false)
      setBemSelecionado(null)
      setVidaUtil('')
      setObs('')
    } else {
      alert(res.error)
    }
  }

  const handleSalvarManutencao = async () => {
    if (!bemSelecionado || !manuData || !manuDesc) return
    const res = await adicionarManutencao({
      bem_id: bemSelecionado.id,
      data_ocorrencia: manuData,
      tipo: manuTipo,
      descricao: manuDesc,
      custo: parseFloat(manuCusto || '0'),
      prestador_id: manuPrestadorId || undefined,
      nfe_id: manuNfeId ? manuNfeId.split(':')[1] : undefined
    })
    if (res.success) {
      setManuData('')
      setManuDesc('')
      setManuCusto('')
      setManuPrestadorId('')
      setManuNfeId('')
      // Não fecha o modal para ver o histórico
    } else {
      alert(res.error)
    }
  }

  const handleExcluirBem = async (bem: BemDuravel) => {
    if (!confirm(`Tem certeza que deseja excluir o bem "${bem.descricao}"? Esta ação não pode ser desfeita.`)) return
    const res = await excluirBem(bem.id)
    if (!res.success) {
      alert(res.error)
    }
  }

  const handleExcluirManutencao = async (m: Manutencao) => {
    if (!confirm('Excluir este registro de manutenção?')) return
    const res = await excluirManutencao(m.id, m.bem_id)
    if (!res.success) {
      alert(res.error)
    }
  }

  const handleSyncNFes = async () => {
    if (!tenantId) {
      alert('Sessão expirada ou tenant não identificado. Por favor, faça login novamente.')
      return
    }
    setSyncing(true)
    try {
      // Buscar itens escriturados com destinação 31 ou 3.1
      // Removemos o filtro de 'classificado' para ser mais resiliente a registros antigos
      // Buscamos sem join para evitar erro de relacionamento caso o cache do Supabase esteja desatualizado
      const { data: itens, error: fetchErr } = await sb.from('nfe_entradas_itens')
        .select('*')
        .or('destinacao_item.eq.31,destinacao_item.eq.3.1')
      
      if (fetchErr) {
        console.error('Fetch items error:', fetchErr)
        alert('Erro ao buscar itens: ' + fetchErr.message)
        return
      }

      console.log('Itens encontrados para sincronismo:', itens)
      
      if (!itens || itens.length === 0) {
        alert('Nenhum item com destinação "Bens Duráveis" foi encontrado nas suas notas fiscais.')
        return
      }

      let count = 0
      for (const item of itens) {
        // Verificar se já existe
        const { data: existing } = await sb.from('bens_duraveis')
          .select('id')
          .eq('nfe_item_id', item.id)
          .maybeSingle()

        if (!existing) {
          // Busca a nota para pegar o número (opcional)
          const { data: nfe } = await sb.from('nfe_entradas')
            .select('numero_nf, data_entrada, data_emissao')
            .eq('id', item.nfe_entrada_id)
            .single()

          await sb.from('bens_duraveis').insert({
            tenant_id: tenantId,
            nfe_id: item.nfe_entrada_id,
            nfe_item_id: item.id,
            descricao: item.descricao_produto,
            codigo_interno: item.codigo_produto || null,
            data_aquisicao: nfe?.data_emissao || nfe?.data_entrada || item.created_at || new Date().toISOString().split('T')[0],
            data_entrada: nfe?.data_entrada || item.created_at || new Date().toISOString().split('T')[0],
            valor_aquisicao: Number(item.valor_produto),
            status: 'pendente_analise',
            observacoes: `Sincronizado manualmente da NF-e ${nfe?.numero_nf || ''}.`
          })
          count++
        }
      }
      
      if (count > 0) {
        await carregarBens()
        alert(`${count} novo(s) bem(ns) identificado(s) e adicionado(s) para análise.`)
      } else {
        alert('Todos os itens das notas já estão no controle de bens.')
      }
    } catch (err: any) {
      alert('Erro na sincronização: ' + err.message)
    } finally {
      setSyncing(false)
    }
  }

  const abrirManutencoes = (bem: BemDuravel) => {
    setBemSelecionado(bem)
    carregarManutencoes(bem.id)
    carregarNfes()
    setShowManutencaoModal(true)
  }

  const handleDownloadDanfe = async (nfeId: string, type: 'nfe' | 'nfse' = 'nfe') => {
    if (!nfeId) return
    try {
      if (type === 'nfe') {
        const { data: nfe, error: nfeErr } = await sb.from('nfe_entradas').select('*').eq('id', nfeId).single()
        if (nfeErr || !nfe) throw new Error('Nota fiscal não encontrada.')
        
        const { data: itens, error: itensErr } = await sb.from('nfe_entradas_itens').select('*').eq('nfe_entrada_id', nfeId)
        if (itensErr) throw new Error('Itens da nota não carregados.')

        abrirDanfeInterno(nfe, itens || [])
      } else {
        const { data: nfse, error: nfseErr } = await sb.from('nfse_entradas').select('*, prestador:fornecedores(*)').eq('id', nfeId).single()
        if (nfseErr || !nfse) throw new Error('Nota fiscal de serviço não encontrada.')
        
        abrirDanfseInterno(nfse)
      }
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700 p-8 min-h-full">
      {/* Header Centralizado - Estilo Hub Premium */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-white/60 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#0e2d22] flex items-center justify-center text-white shadow-lg shadow-emerald-900/20 transition-all duration-500">
            <Briefcase size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">Gestão de Bens Duráveis</h1>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-70">Controle Patrimonial e Vida Útil — ACPROBEC</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Tab Switcher - Premium Interaction */}
          <div className="bg-slate-100/60 p-1.5 rounded-[22px] flex items-center gap-1 border border-slate-200/40 backdrop-blur-sm shadow-inner">
            <button
              onClick={() => setActiveTab('ativos')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-wider transition-all duration-500 ${
                activeTab === 'ativos' ? 'bg-white text-emerald-600 shadow-md border border-slate-200/50 scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
              }`}
            >
              <CheckCircle2 size={14} />
              Ativos
              {ativos.length > 0 && (
                <span className="ml-1 bg-emerald-100 text-emerald-700 py-0.5 px-1.5 rounded-full text-[9px] font-black">{ativos.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('pendentes')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-wider transition-all duration-500 ${
                activeTab === 'pendentes' ? 'bg-white text-amber-600 shadow-md border border-slate-200/50 scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
              }`}
            >
              <AlertTriangle size={14} />
              Pendentes
              {pendentes.length > 0 && (
                <span className="ml-1 bg-amber-100 text-amber-700 py-0.5 px-1.5 rounded-full text-[9px] font-black">{pendentes.length}</span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => { carregarTodasManutencoes(); setShowReports(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 border border-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-50 transition-all shadow-sm"
            >
              <Printer size={14} />
              Relatórios
            </button>
            
            {(criar || isAdmin) && (
              <button 
                onClick={handleSyncNFes}
                disabled={syncing}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#0e2d22] text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20"
              >
                {syncing ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle2 size={14} className="text-emerald-400" />
                )}
                Sincronizar Notas
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-auto p-8 relative">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-[#2d8c6f] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activeTab === 'pendentes' ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            {pendentes.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-3 opacity-50" />
                <p className="text-sm font-medium">Nenhum bem pendente de análise.</p>
                <p className="text-xs mt-1">Os itens lançados via NF-e com destinação 3.1 aparecerão aqui.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="py-4 px-6">Descrição do Bem</th>
                    <th className="py-4 px-6">Aquisição</th>
                    <th className="py-4 px-6">Data Entrada</th>
                    <th className="py-4 px-6 text-right">Valor Aquis.</th>
                    <th className="py-4 px-6 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-slate-700">
                  {pendentes.map(bem => (
                    <tr key={bem.id} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold">{bem.descricao}</td>
                      <td className="py-4 px-6 text-slate-500">{bem.data_aquisicao ? new Date(bem.data_aquisicao).toLocaleDateString('pt-BR') : '-'}</td>
                      <td className="py-4 px-6 text-slate-500">{bem.data_entrada ? new Date(bem.data_entrada).toLocaleDateString('pt-BR') : new Date(bem.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="py-4 px-6 text-right font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bem.valor_aquisicao || 0)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(editar || criar || isAdmin) && (
                            <button
                              onClick={() => {
                                setBemSelecionado(bem)
                                setVidaUtil('')
                                setObs(bem.observacoes || '')
                                setShowCadastroModal(true)
                              }}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                            >
                              Analisar e Ativar
                            </button>
                          )}
                          {(excluir || isAdmin) && (
                            <button
                              onClick={() => handleExcluirBem(bem)}
                              className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            {ativos.length === 0 ? (
               <div className="p-12 text-center text-slate-500">
                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Nenhum bem ativo cadastrado.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="py-4 px-6">Descrição do Bem</th>
                    <th className="py-4 px-6">Aquisição</th>
                    <th className="py-4 px-6">Data Entrada</th>
                    <th className="py-4 px-6">Valor Aquis.</th>
                    <th className="py-4 px-6">Vida Útil</th>
                    <th className="py-4 px-6 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-slate-700">
                  {ativos.map(bem => (
                    <tr key={bem.id} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold">{bem.descricao}</td>
                      <td className="py-4 px-6 text-slate-500">{bem.data_aquisicao ? new Date(bem.data_aquisicao).toLocaleDateString('pt-BR') : '-'}</td>
                      <td className="py-4 px-6 text-slate-500">{bem.data_entrada ? new Date(bem.data_entrada).toLocaleDateString('pt-BR') : new Date(bem.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="py-4 px-6 font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bem.valor_aquisicao || 0)}
                      </td>
                      <td className="py-4 px-6 text-slate-500">{bem.vida_util_meses} meses</td>
                      <td className="py-4 px-6 text-right">
                         <div className="flex items-center justify-end gap-2">
                           <button
                            onClick={() => abrirManutencoes(bem)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <Wrench size={14} /> Manutenções
                          </button>
                          {(excluir || isAdmin) && (
                            <button
                              onClick={() => handleExcluirBem(bem)}
                              className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          {bem.nfe_id && (
                            <button
                              onClick={() => handleDownloadDanfe(bem.nfe_id!)}
                              className="p-2 text-indigo-400 hover:text-indigo-600 transition-colors"
                              title="Download DANFE Compra"
                            >
                              <FileText size={16} />
                            </button>
                          )}
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE CADASTRO */}
      {showCadastroModal && bemSelecionado && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 bg-amber-50">
              <h3 className="text-lg font-black text-amber-900">Finalizar Cadastro de Bem</h3>
              <p className="text-xs font-medium text-amber-700/80 mt-1">{bemSelecionado.descricao}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Vida Útil Estimada (Meses)</label>
                <input
                  type="number"
                  value={vidaUtil}
                  onChange={e => setVidaUtil(e.target.value)}
                  placeholder="Ex: 60"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Observações Adicionais</label>
                <textarea
                  value={obs}
                  onChange={e => setObs(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 min-h-[80px]"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-slate-50 flex gap-3 justify-end">
              <button
                onClick={() => setShowCadastroModal(false)}
                className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleFinalizarCadastro}
                disabled={!vidaUtil}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Ativar Bem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE MANUTENÇÕES */}
      {showManutencaoModal && bemSelecionado && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-800">Manutenções e Ocorrências</h3>
                <p className="text-xs font-medium text-slate-500 mt-1">{bemSelecionado.descricao}</p>
              </div>
              <button onClick={() => setShowManutencaoModal(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                ✕
              </button>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
              {/* Formulário */}
              <div className="w-[320px] bg-slate-50 p-6 border-r border-gray-100 shrink-0 overflow-y-auto">
                <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-4">Novo Registro</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data</label>
                    <input
                      type="date"
                      value={manuData}
                      onChange={e => setManuData(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d8c6f]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo</label>
                    <select
                      value={manuTipo}
                      onChange={e => setManuTipo(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d8c6f]/50"
                    >
                      <option value="preventiva">Preventiva</option>
                      <option value="corretiva">Corretiva</option>
                      <option value="ocorrencia">Ocorrência Comum</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descrição</label>
                    <textarea
                      value={manuDesc}
                      onChange={e => setManuDesc(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d8c6f]/50 min-h-[80px]"
                      placeholder="Detalhes..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Custo (R$)</label>
                    <input
                      type="number"
                      value={manuCusto}
                      onChange={e => setManuCusto(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d8c6f]/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Prestador de Serviço</label>
                    <select
                      value={manuPrestadorId}
                      onChange={e => setManuPrestadorId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d8c6f]/50"
                    >
                      <option value="">Selecione o Prestador...</option>
                      {fornecedores.map(f => (
                        <option key={f.id} value={f.id}>{f.nome} ({f.cpf_cnpj})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vincular Nota Fiscal</label>
                    <select
                      value={manuNfeId}
                      onChange={e => setManuNfeId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d8c6f]/50"
                    >
                      <option value="">Nenhuma nota vinculada...</option>
                      {listaNfes.map(n => (
                        <option key={`${n.tipo}-${n.id}`} value={`${n.tipo}:${n.id}`}>
                          {n.display} ({new Date(n.data_emissao).toLocaleDateString('pt-BR')})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {(criar || editar || isAdmin) && (
                    <button
                      onClick={handleSalvarManutencao}
                      disabled={!manuData || !manuDesc}
                      className="w-full py-2.5 bg-[#2d8c6f] hover:bg-[#24755c] text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
                    >
                      Salvar Registro
                    </button>
                  )}
                </div>
              </div>
              
              {/* Lista Histórico */}
              <div className="flex-1 overflow-y-auto p-6 bg-white">
                <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-4">Histórico do Bem</h4>
                
                {manutencoes.length === 0 ? (
                  <div className="text-center p-8 text-slate-400 text-sm">Nenhum registro encontrado.</div>
                ) : (
                  <div className="space-y-3">
                    {manutencoes.map(m => (
                      <div 
                        key={m.id} 
                        onClick={() => {
                          setSelectedManutencao(m)
                          setShowDetalhesModal(true)
                        }}
                        className="p-4 rounded-xl border border-gray-100 bg-slate-50 hover:border-[#2d8c6f]/40 hover:bg-[#2d8c6f]/5 transition-all cursor-pointer flex gap-4 group"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          m.tipo === 'preventiva' ? 'bg-blue-100 text-blue-600' :
                          m.tipo === 'corretiva' ? 'bg-red-100 text-red-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          <Wrench size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h5 className="font-bold text-slate-700 text-sm group-hover:text-[#2d8c6f] transition-colors truncate">{m.descricao}</h5>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-gray-200 text-slate-500 uppercase ml-2 shrink-0">
                              {m.tipo}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(m.data_ocorrencia).toLocaleDateString('pt-BR')}</span>
                            {m.custo > 0 && (
                              <span className="font-medium text-red-500 bg-red-50 px-1.5 rounded">
                                Custo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m.custo)}
                              </span>
                            )}
                            {(m as any).prestador && (
                              <span className="flex items-center gap-1 text-[10px] bg-slate-100 px-1.5 rounded font-bold text-slate-600">
                                <Briefcase size={10} /> {(m as any).prestador.nome}
                              </span>
                            )}
                            {(m as any).nfe && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const isNfe = (m as any).nfe.numero_nf !== undefined
                                  handleDownloadDanfe(m.nfe_id!, isNfe ? 'nfe' : 'nfse')
                                }}
                                className="flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-600 px-1.5 rounded font-bold hover:bg-indigo-100 transition-all"
                              >
                                <FileText size={10} /> {(m as any).nfe.numero_nf ? `NFe ${ (m as any).nfe.numero_nf}` : `NFSe ${(m as any).nfe.numero_nfse}`}
                              </button>
                            )}
                          </div>
                        </div>
                        {(excluir || isAdmin) && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleExcluirManutencao(m)
                            }}
                            className="p-1.5 text-slate-300 hover:text-red-500 transition-colors hover:bg-red-50 rounded-lg shrink-0 self-start"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL DETALHES PREMIUM */}
      {showDetalhesModal && selectedManutencao && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-[#1d4f3e] w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="p-8 pb-4 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md">
                  <Wrench size={24} />
                </div>
                <div>
                  <h3 className="text-white font-black text-xl tracking-tight uppercase">Detalhes da Manutenção</h3>
                  <p className="text-emerald-300/80 text-[10px] font-bold uppercase tracking-widest mt-1">Conformidade Patrimonial ACPROBEC</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDetalhesModal(false)}
                className="p-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="px-8 py-6 space-y-6">
              {/* Descrição Principal */}
              <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                <span className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Descrição Técnica</span>
                <p className="text-white text-lg font-medium leading-relaxed">{selectedManutencao.descricao}</p>
              </div>

              {/* Grid de Informações */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <span className="block text-[10px] font-black text-emerald-400 uppercase mb-1">Data da Ocorrência</span>
                  <span className="text-white font-bold">{new Date(selectedManutencao.data_ocorrencia).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <span className="block text-[10px] font-black text-emerald-400 uppercase mb-1">Tipo de Intervenção</span>
                  <span className="text-white font-bold uppercase tracking-wider">{selectedManutencao.tipo}</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <span className="block text-[10px] font-black text-emerald-400 uppercase mb-1">Custo do Serviço</span>
                  <span className="text-white font-black text-lg">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedManutencao.custo)}
                  </span>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <span className="block text-[10px] font-black text-emerald-400 uppercase mb-1">Patrimônio Vinculado</span>
                  <span className="text-white font-bold block truncate">{bemSelecionado?.descricao}</span>
                  <span className="text-emerald-300/60 text-[9px] font-bold">COD: {bemSelecionado?.codigo_interno || 'N/I'}</span>
                </div>
              </div>

              {/* Prestador e Documentos */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <Briefcase className="text-emerald-400 shrink-0" size={18} />
                  <div className="min-w-0">
                    <span className="block text-[9px] font-black text-emerald-400 uppercase mb-0.5">Prestador Responsável</span>
                    <span className="text-white font-bold truncate block">{selectedManutencao.prestador?.nome || 'Não informado'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      if (selectedManutencao.nfe_id) {
                        const isNfe = selectedManutencao.nfe?.numero_nf !== undefined
                        handleDownloadDanfe(selectedManutencao.nfe_id, isNfe ? 'nfe' : 'nfse')
                      }
                    }}
                    disabled={!selectedManutencao.nfe_id}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                      selectedManutencao.nfe_id 
                      ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                      : 'bg-white/5 border-white/5 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    <FileText size={18} />
                    <div className="text-left">
                      <span className="block text-[9px] font-black uppercase">Nota Serviço</span>
                      <span className="text-[11px] font-bold">Visualizar DANFE</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => bemSelecionado?.nfe_id && handleDownloadDanfe(bemSelecionado.nfe_id, 'nfe')}
                    disabled={!bemSelecionado?.nfe_id}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                      bemSelecionado?.nfe_id 
                      ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                      : 'bg-white/5 border-white/5 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    <Package size={18} />
                    <div className="text-left">
                      <span className="block text-[9px] font-black uppercase">Nota do Bem</span>
                      <span className="text-[11px] font-bold">Visualizar Compra</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-black/20 text-center">
              <button 
                onClick={() => setShowDetalhesModal(false)}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-[#1d4f3e] font-black text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RELATÓRIOS */}
      <FixedAssetsReports 
        isOpen={showReports} 
        onClose={() => setShowReports(false)} 
        bens={ativos} 
        manutencoes={todasManutencoes} 
      />
    </div>
  )
}
