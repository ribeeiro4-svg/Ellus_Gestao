'use client'
import React, { useState, useEffect } from 'react'
import { Plus, Briefcase, Calendar, AlertTriangle, CheckCircle2, MoreVertical, Search, Wrench, FileText } from 'lucide-react'
import { useBensDuraveis, BemDuravel } from '../hooks/useBensDuraveis'
import { createClient } from '@/lib/supabase/client'

type Props = {
  tenantId: string | null
}

export default function BensDuraveisHub({ tenantId }: Props) {
  const { bens, manutencoes, loading, carregarBens, atualizarBem, carregarManutencoes, adicionarManutencao } = useBensDuraveis(tenantId)
  const [activeTab, setActiveTab] = useState<'pendentes' | 'ativos'>('pendentes')
  const [syncing, setSyncing] = useState(false)
  const sb = createClient()
  
  // Modals
  const [bemSelecionado, setBemSelecionado] = useState<BemDuravel | null>(null)
  const [showCadastroModal, setShowCadastroModal] = useState(false)
  const [showManutencaoModal, setShowManutencaoModal] = useState(false)

  // Form states
  const [vidaUtil, setVidaUtil] = useState('')
  const [obs, setObs] = useState('')
  const [manuData, setManuData] = useState('')
  const [manuTipo, setManuTipo] = useState<'preventiva'|'corretiva'|'ocorrencia'>('ocorrencia')
  const [manuDesc, setManuDesc] = useState('')
  const [manuCusto, setManuCusto] = useState('')

  useEffect(() => {
    if (tenantId) carregarBens()
  }, [tenantId, carregarBens])

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
      custo: parseFloat(manuCusto || '0')
    })
    if (res.success) {
      setManuData('')
      setManuDesc('')
      setManuCusto('')
      // Não fecha o modal para ver o histórico
    } else {
      alert(res.error)
    }
  }

  const handleSyncNFes = async () => {
    if (!tenantId) return
    setSyncing(true)
    try {
      // Buscar itens escriturados com destinação 31 ou 3.1
      const { data: itens } = await sb.from('nfe_entradas_itens')
        .select('*, nfe:nfe_entradas(data_entrada, numero_nf)')
        .eq('classificado', true)
        .or('destinacao_item.eq.31,destinacao_item.eq.3.1')
      
      if (!itens || itens.length === 0) {
        alert('Nenhum item pendente encontrado nas notas escrituradas.')
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
          await sb.from('bens_duraveis').insert({
            tenant_id: tenantId,
            nfe_id: item.nfe_entrada_id,
            nfe_item_id: item.id,
            descricao: item.descricao_produto,
            codigo_interno: item.codigo_produto || null,
            data_aquisicao: item.nfe?.data_entrada || new Date().toISOString().split('T')[0],
            valor_aquisicao: Number(item.valor_produto),
            status: 'pendente_analise',
            observacoes: `Sincronizado manualmente da NF-e ${item.nfe?.numero_nf || ''}.`
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
    setShowManutencaoModal(true)
  }

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] relative overflow-hidden">
      {/* HEADER */}
      <div className="bg-white px-8 pt-8 pb-0 border-b border-gray-100 shrink-0 shadow-sm relative z-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shadow-inner">
            <Briefcase size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gestão de Bens Duráveis</h1>
            <p className="text-[13px] text-slate-500 font-medium">Controle patrimonial e vida útil de itens de uso ou consumo</p>
          </div>
        </div>

        <div className="flex gap-6 mt-6">
          <button
            onClick={() => setActiveTab('pendentes')}
            className={`pb-3 text-[13px] font-bold tracking-wide uppercase transition-all border-b-2 relative ${
              activeTab === 'pendentes' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Pendentes de Análise
            {pendentes.length > 0 && (
              <span className="ml-2 bg-amber-100 text-amber-700 py-0.5 px-2 rounded-full text-[10px] font-black">{pendentes.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('ativos')}
            className={`pb-3 text-[13px] font-bold tracking-wide uppercase transition-all border-b-2 relative ${
              activeTab === 'ativos' ? 'border-[#2d8c6f] text-[#2d8c6f]' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Bens Ativos
            {ativos.length > 0 && (
              <span className="ml-2 bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-[10px] font-black">{ativos.length}</span>
            )}
          </button>
        </div>

        <button 
          onClick={handleSyncNFes}
          disabled={syncing}
          className="absolute right-8 bottom-3 flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg shadow-slate-900/10"
        >
          {syncing ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <CheckCircle2 size={14} className="text-emerald-400" />
          )}
          Sincronizar com Notas Fiscais
        </button>
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
                    <th className="py-4 px-6">Data de Aquisição</th>
                    <th className="py-4 px-6 text-right">Valor Aquis.</th>
                    <th className="py-4 px-6 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-slate-700">
                  {pendentes.map(bem => (
                    <tr key={bem.id} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold">{bem.descricao}</td>
                      <td className="py-4 px-6 text-slate-500">{new Date(bem.data_aquisicao!).toLocaleDateString('pt-BR')}</td>
                      <td className="py-4 px-6 text-right font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bem.valor_aquisicao || 0)}
                      </td>
                      <td className="py-4 px-6 text-right">
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
                    <th className="py-4 px-6">Valor Aquis.</th>
                    <th className="py-4 px-6">Vida Útil</th>
                    <th className="py-4 px-6 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-slate-700">
                  {ativos.map(bem => (
                    <tr key={bem.id} className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold">{bem.descricao}</td>
                      <td className="py-4 px-6 text-slate-500">{new Date(bem.data_aquisicao!).toLocaleDateString('pt-BR')}</td>
                      <td className="py-4 px-6 font-medium">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bem.valor_aquisicao || 0)}
                      </td>
                      <td className="py-4 px-6 text-slate-500">{bem.vida_util_meses} meses</td>
                      <td className="py-4 px-6 text-right">
                         <button
                          onClick={() => abrirManutencoes(bem)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Wrench size={14} /> Manutenções
                        </button>
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
                  
                  <button
                    onClick={handleSalvarManutencao}
                    disabled={!manuData || !manuDesc}
                    className="w-full py-2.5 bg-[#2d8c6f] hover:bg-[#24755c] text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
                  >
                    Salvar Registro
                  </button>
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
                      <div key={m.id} className="p-4 rounded-xl border border-gray-100 bg-slate-50 hover:border-gray-200 transition-colors flex gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          m.tipo === 'preventiva' ? 'bg-blue-100 text-blue-600' :
                          m.tipo === 'corretiva' ? 'bg-red-100 text-red-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          <Wrench size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h5 className="font-bold text-slate-700 text-sm">{m.descricao}</h5>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-gray-200 text-slate-500 uppercase">
                              {m.tipo}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(m.data_ocorrencia).toLocaleDateString('pt-BR')}</span>
                            {m.custo > 0 && (
                              <span className="font-medium text-red-500 bg-red-50 px-1.5 rounded">
                                Custo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m.custo)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
