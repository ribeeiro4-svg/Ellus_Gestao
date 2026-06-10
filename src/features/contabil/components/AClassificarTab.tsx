'use client'
import React, { useState, useEffect } from 'react'
import { AlertCircle, ArrowRightLeft, Search, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTenantId } from '@/lib/hooks/useTenantId'
import ContaContabilSelect from './ContaContabilSelect'

export default function AClassificarTab({ planoHook, lancHook }: any) {
  const tenantId = useTenantId()
  const [itens, setItens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [itemSelecionado, setItemSelecionado] = useState<any | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [filtroNatureza, setFiltroNatureza] = useState<'all' | 'D' | 'C'>('all')
  const [novaContaCodigo, setNovaContaCodigo] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const sb = createClient()

  const carregarItens = async () => {
    if (!tenantId) return
    setLoading(true)

    // Buscar lançamentos com todas as suas partidas
    const { data: lancamentos } = await sb
      .from('lancamentos_contabeis')
      .select('*, partidas:lancamentos_partidas(*, conta:conta_id(*))')
      .eq('tenant_id', tenantId)
      .eq('status', 'confirmado')
      .order('data_competencia', { ascending: false })

    // Filtrar apenas lançamentos que possuem pelo menos uma partida a classificar
    const itensFiltrados = (lancamentos || []).filter(l => 
      l.partidas && l.partidas.some((p: any) => p.conta && p.conta.descricao?.toLowerCase().includes('classificar'))
    )

    setItens(itensFiltrados)
    setLoading(false)
  }

  useEffect(() => {
    carregarItens()
  }, [tenantId])

  const handleReclassificar = async () => {
    const isBatch = selectedIds.length > 0
    if (!novaContaCodigo) return
    if (!isBatch && !itemSelecionado) return
    
    setSaving(true)

    try {
      const novaConta = planoHook.contas.find((c: any) => c.codigo === novaContaCodigo)
      if (!novaConta) throw new Error('Conta não encontrada no plano')

      if (isBatch) {
        const { reclassificarLoteAction } = await import('../actions/reclassificarAction')
        
        // Preparar os itens do lote buscando a partida alvo de cada um
        const itensLote = itens
          .filter(i => selectedIds.includes(i.id))
          .map(i => {
            const alvo = getPartidaAlvo(i)
            return alvo ? { lancamentoId: i.id, contaAntigaId: alvo.conta_id } : null
          })
          .filter(Boolean) as { lancamentoId: string; contaAntigaId: string }[]

        const res = await reclassificarLoteAction(itensLote, novaConta.id)
        if (res.error) throw new Error(res.error)
        
        alert(`${itensLote.length} lançamentos reclassificados com sucesso!`)
      } else {
        const partidaAlvo = getPartidaAlvo(itemSelecionado)
        if (!partidaAlvo) throw new Error('Partida a classificar não encontrada')

        const { reclassificarLancamentoAction } = await import('../actions/reclassificarAction')
        const res = await reclassificarLancamentoAction(
          itemSelecionado.id,
          partidaAlvo.conta_id,
          novaConta.id
        )
        if (res.error) throw new Error(res.error)
        alert('Lançamento reclassificado com sucesso!')
      }

      setItemSelecionado(null)
      setSelectedIds([])
      setNovaContaCodigo('')
      carregarItens()
      lancHook.refresh()
    } catch (err: any) {
      alert(`Erro: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const formatarValor = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)

  // Função auxiliar para pegar a partida "A classificar" para exibir na lista da esquerda
  const getPartidaAlvo = (lanc: any) => lanc.partidas.find((p: any) => p.conta.descricao?.toLowerCase().includes('classificar'))

  const filtrados = itens.filter(i => {
    const matchBusca = i.historico?.toLowerCase().includes(searchTerm.toLowerCase()) || i.numero_lancamento?.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchBusca) return false
    
    if (filtroNatureza !== 'all') {
      const alvo = getPartidaAlvo(i)
      if (alvo?.tipo_partida !== filtroNatureza) return false
    }
    return true
  })

  const todosSelecionados = filtrados.length > 0 && filtrados.every(i => selectedIds.includes(i.id))
  
  const toggleSelectAll = () => {
    if (todosSelecionados) {
      setSelectedIds(prev => prev.filter(id => !filtrados.some(f => f.id === id)))
    } else {
      const novosIds = new Set([...selectedIds, ...filtrados.map(i => i.id)])
      setSelectedIds(Array.from(novosIds))
      setItemSelecionado(null)
    }
  }

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    setItemSelecionado(null)
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300 flex flex-col h-[calc(100vh-280px)]">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <AlertCircle className="text-amber-500" size={20} />
            Lançamentos A Classificar
          </h2>
          <p className="text-xs font-bold text-slate-400 mt-1">Classifique os registros pendentes de categorização contábil</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto shrink-0">
          <select 
            value={filtroNatureza} 
            onChange={(e) => setFiltroNatureza(e.target.value as any)}
            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="all">Todas as Naturezas</option>
            <option value="D">Apenas Débitos (D)</option>
            <option value="C">Apenas Créditos (C)</option>
          </select>

          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar lançamentos..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Lista */}
        <div className={`flex-1 flex flex-col border-r border-gray-100 ${(itemSelecionado || selectedIds.length > 0) ? 'hidden lg:flex lg:w-1/2 flex-none' : 'w-full'}`}>
          {loading ? (
            <div className="flex flex-1 items-center justify-center p-12 text-sm text-slate-400 font-bold">Carregando pendências...</div>
          ) : itens.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-16 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4">
                <Check size={32} />
              </div>
              <h3 className="text-slate-700 font-black text-lg">Tudo limpo!</h3>
              <p className="text-slate-400 text-sm mt-1 font-medium">Nenhum lançamento aguardando classificação.</p>
            </div>
          ) : (
            <>
              {/* Barra de Seleção em Lote */}
              <div className="p-4 border-b border-gray-100 bg-slate-50 flex items-center justify-between shrink-0">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={todosSelecionados}
                      onChange={toggleSelectAll}
                      className="peer appearance-none w-5 h-5 border-2 border-slate-200 rounded-md checked:bg-indigo-600 checked:border-indigo-600 cursor-pointer transition-all"
                    />
                    <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                  </div>
                  <span className="text-xs font-black text-slate-600 group-hover:text-slate-800 uppercase tracking-widest">
                    {todosSelecionados ? 'Desmarcar Todos' : 'Selecionar Visíveis'}
                  </span>
                </label>
                <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100">
                  {filtrados.length} Registros
                </span>
              </div>

              <div className="divide-y divide-gray-50 overflow-y-auto flex-1">
                {filtrados.map(item => {
                  const alvo = getPartidaAlvo(item)
                  const valorTotal = item.partidas.filter((p:any) => p.tipo_partida === 'D').reduce((acc:number, p:any) => acc + p.valor, 0)
                  const isChecked = selectedIds.includes(item.id)
                  
                  return (
                  <div 
                    key={item.id}
                    onClick={() => {
                      // Clique fora do checkbox seleciona apenas o item individual (limpa o lote)
                      setSelectedIds([])
                      setItemSelecionado(item)
                      setNovaContaCodigo('')
                    }}
                    className={`p-4 cursor-pointer transition-all hover:bg-indigo-50/50 flex gap-4 ${itemSelecionado?.id === item.id ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'} ${isChecked ? 'bg-indigo-50/30' : ''}`}
                  >
                    <div className="pt-1" onClick={(e) => toggleSelect(item.id, e)}>
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {}} // Tratado no onClick do div pai
                          className="peer appearance-none w-5 h-5 border-2 border-slate-200 rounded-md checked:bg-indigo-600 checked:border-indigo-600 cursor-pointer transition-all"
                        />
                        <Check size={12} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.numero_lancamento} • {new Date(item.data_competencia).toLocaleDateString('pt-BR')}</span>
                        <span className="text-xs font-black text-slate-700">{formatarValor(valorTotal)}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700 leading-snug truncate">{item.historico}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 text-amber-700 text-[9px] font-black uppercase">
                          <span className={`px-1 rounded text-[8px] mr-1 ${alvo?.tipo_partida === 'D' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                            {alvo?.tipo_partida}
                          </span>
                          {alvo?.conta?.codigo}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-[9px] font-black uppercase ${alvo?.tipo_partida === 'C' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {alvo?.tipo_partida === 'C' ? 'INGRESSO' : 'DISPÊNDIO'}
                        </span>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            </>
          )}
        </div>

        {/* Detalhes / Ação */}
        {(itemSelecionado || selectedIds.length > 0) && (
          <div className="flex-1 bg-slate-50/50 p-6 flex flex-col overflow-y-auto">
            {selectedIds.length > 0 ? (
              // MODO LOTE
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black text-indigo-800 uppercase tracking-widest">Classificação em Lote</h3>
                  <button onClick={() => setSelectedIds([])} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors lg:hidden">
                    <X size={16} />
                  </button>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto text-center">
                  <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <ArrowRightLeft size={28} />
                  </div>
                  <h4 className="text-2xl font-black text-slate-800 mb-2">{selectedIds.length} Registros</h4>
                  <p className="text-xs font-bold text-slate-500 mb-8 leading-relaxed">
                    Você está prestes a reclassificar múltiplos lançamentos de uma só vez. Selecione a conta de destino que será aplicada a todos eles.
                  </p>

                  <div className="w-full mb-6 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <ContaContabilSelect 
                      value={novaContaCodigo}
                      onChange={(item) => setNovaContaCodigo(item.codigo)}
                    />
                  </div>

                  <button
                    onClick={handleReclassificar}
                    disabled={!novaContaCodigo || saving}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-xl shadow-md transition-all disabled:opacity-50 disabled:shadow-none"
                  >
                    {saving ? 'Processando Lote...' : `Salvar ${selectedIds.length} Classificações`}
                  </button>
                </div>
              </>
            ) : itemSelecionado && (
              // MODO INDIVIDUAL
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Classificar Registro</h3>
                  <button onClick={() => setItemSelecionado(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors lg:hidden">
                    <X size={16} />
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm shrink-0">
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Histórico do Lançamento</span>
                    <p className="text-sm font-bold text-slate-700">{itemSelecionado.historico}</p>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-2">Partidas Atuais do Lançamento</span>
                    <div className="space-y-2">
                      {itemSelecionado.partidas.sort((a:any, b:any) => (a.tipo_partida === 'D' ? -1 : 1)).map((p: any) => {
                        const isAlvo = p.conta.descricao?.toLowerCase().includes('classificar')
                        return (
                          <div key={p.id} className={`flex items-center justify-between p-2.5 rounded-xl border ${isAlvo ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${p.tipo_partida === 'D' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>
                                {p.tipo_partida}
                              </span>
                              <div>
                                <p className={`text-xs font-bold ${isAlvo ? 'text-amber-700' : 'text-slate-700'}`}>{p.conta.codigo} - {p.conta.descricao}</p>
                                {isAlvo && <p className="text-[9px] font-black text-amber-500 uppercase mt-0.5">⚠️ Requer Classificação</p>}
                              </div>
                            </div>
                            <span className="text-xs font-black text-slate-600">{formatarValor(p.valor)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Valor do Lançamento</span>
                      <p className="text-lg font-black text-indigo-600">{formatarValor(itemSelecionado.partidas.find((p:any)=>p.tipo_partida==='D')?.valor || 0)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Data Competência</span>
                      <p className="text-sm font-bold text-slate-700">{new Date(itemSelecionado.data_competencia).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-end w-full mx-auto mt-4 shrink-0">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                      <ArrowRightLeft size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-500">Selecione a conta contábil correta para substituir a conta <span className="text-amber-600 font-black">[{getPartidaAlvo(itemSelecionado)?.conta.codigo}]</span>.</p>
                  </div>

                  <div className="mb-6 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <ContaContabilSelect 
                      value={novaContaCodigo}
                      onChange={(item) => setNovaContaCodigo(item.codigo)}
                    />
                  </div>

                  <button
                    onClick={handleReclassificar}
                    disabled={!novaContaCodigo || saving}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-xl shadow-md transition-all disabled:opacity-50 disabled:shadow-none"
                  >
                    {saving ? 'Aplicando...' : 'Salvar Classificação'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
