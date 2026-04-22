'use client'
import React, { useState } from 'react'
import { Package, Plus, TrendingDown, Search, AlertTriangle, ArrowDown, ArrowUp, Layers } from 'lucide-react'

const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const fmtQtd = (v: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 4 }).format(v || 0)

type SubTab = 'produtos' | 'kardex' | 'baixas'

export default function EstoqueTab({ estoqueHook }: { estoqueHook: any }) {
  const { produtos, movimentacoes, baixas, stats, criarProduto, criarBaixa, ajustarInventario, fetchMovimentacoes } = estoqueHook
  const [sub, setSub] = useState<SubTab>('produtos')
  const [search, setSearch] = useState('')
  const [showNovoProduto, setShowNovoProduto] = useState(false)
  const [showNovaBaixa, setShowNovaBaixa] = useState(false)
  const [produtoKardex, setProdutoKardex] = useState('')
  const [novoProduto, setNovoProduto] = useState({ descricao: '', unidade_medida: 'UN', tipo_produto: 'consumo', estoque_minimo: 0 })
  const [novaBaixa, setNovaBaixa] = useState({ tipo: 'consumo_interno', solicitante: '', projeto_ref: '', beneficiario_nome: '', observacoes: '' })
  const [itensBaixa, setItensBaixa] = useState<{ produtoId: string; quantidade: number }[]>([{ produtoId: '', quantidade: 1 }])

  const filteredProdutos = produtos.filter((p: any) =>
    !search || p.descricao.toLowerCase().includes(search.toLowerCase()) || p.codigo_interno?.includes(search)
  )

  const movFiltradas = produtoKardex
    ? movimentacoes.filter((m: any) => m.produto_id === produtoKardex)
    : movimentacoes

  const handleCriarProduto = async () => {
    const r = await criarProduto({ ...novoProduto, controla_estoque: true, ativo: true, custo_medio_ponderado: 0 })
    if (r.error) alert(r.error)
    else { setShowNovoProduto(false); setNovoProduto({ descricao: '', unidade_medida: 'UN', tipo_produto: 'consumo', estoque_minimo: 0 }) }
  }

  const handleCriarBaixa = async () => {
    const itensValidos = itensBaixa.filter(i => i.produtoId && i.quantidade > 0)
    if (!itensValidos.length) return alert('Adicione ao menos 1 item')
    const r = await criarBaixa(novaBaixa.tipo, itensValidos, novaBaixa)
    if (r.error) alert(r.error)
    else { setShowNovaBaixa(false); alert(`Requisição ${r.numeroReq} criada!`) }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Produtos', value: stats.totalProdutos, icon: Package, color: '#6366f1' },
          { label: 'Abaixo Mínimo', value: stats.produtosAbaixoMinimo, icon: AlertTriangle, color: '#f59e0b' },
          { label: 'Sem Estoque', value: stats.produtosSemEstoque, icon: TrendingDown, color: '#ef4444' },
          { label: 'Valor em Estoque', value: fmtR(stats.valorTotalEstoque), icon: Layers, color: '#10b981' },
        ].map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <div key={i} className="kpi-card p-5" style={{ '--kpi-color': kpi.color } as any}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${kpi.color}18` }}>
                <Icon size={16} style={{ color: kpi.color }} />
              </div>
              <div className="text-xl font-black text-slate-800">{kpi.value}</div>
              <div className="text-xs font-bold text-slate-500 mt-0.5">{kpi.label}</div>
            </div>
          )
        })}
      </div>

      {/* Sub tabs */}
      <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {(['produtos', 'kardex', 'baixas'] as SubTab[]).map(t => (
          <button key={t} onClick={() => setSub(t)}
            className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${sub === t ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            {t === 'produtos' ? '📦 Produtos' : t === 'kardex' ? '📊 Kardex' : '📋 Requisições'}
          </button>
        ))}
      </div>

      {/* PRODUTOS */}
      {sub === 'produtos' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input type="text" placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-medium outline-none shadow-sm" />
            </div>
            <button onClick={() => setShowNovoProduto(!showNovoProduto)}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all">
              <Plus size={14} /> Novo Produto
            </button>
          </div>

          {showNovoProduto && (
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <h4 className="text-sm font-black text-slate-700 mb-3">Cadastrar Produto</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Descrição *</label>
                  <input type="text" value={novoProduto.descricao} onChange={e => setNovoProduto(p => ({ ...p, descricao: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Unidade</label>
                  <select value={novoProduto.unidade_medida} onChange={e => setNovoProduto(p => ({ ...p, unidade_medida: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none">
                    {['UN', 'KG', 'L', 'M', 'M2', 'M3', 'CX', 'PC', 'PAR', 'DZ'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Tipo</label>
                  <select value={novoProduto.tipo_produto} onChange={e => setNovoProduto(p => ({ ...p, tipo_produto: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none">
                    <option value="consumo">Consumo</option>
                    <option value="distribuicao">Distribuição</option>
                    <option value="insumo_projeto">Insumo de Projeto</option>
                    <option value="ativo_imobilizado">Ativo Imobilizado</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Estoque Mínimo</label>
                  <input type="number" value={novoProduto.estoque_minimo} onChange={e => setNovoProduto(p => ({ ...p, estoque_minimo: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={handleCriarProduto} className="px-5 py-2 text-xs font-black text-white bg-emerald-600 rounded-xl">Salvar</button>
                <button onClick={() => setShowNovoProduto(false)} className="px-5 py-2 text-xs font-black text-slate-500 bg-slate-100 rounded-xl">Cancelar</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {filteredProdutos.length === 0 ? (
              <div className="flex flex-col items-center py-16">
                <Package size={36} className="text-slate-200 mb-2" />
                <p className="text-xs font-bold text-slate-400">Nenhum produto cadastrado</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {['Código', 'Produto', 'Tipo', 'Unid.', 'Saldo', 'CMP', 'Valor Total', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProdutos.map((p: any) => {
                    const abaixoMin = p.controla_estoque && (p.saldo ?? 0) < p.estoque_minimo
                    const semEstoque = (p.saldo ?? 0) === 0
                    return (
                      <tr key={p.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{p.codigo_interno}</td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800">{p.descricao}</p>
                          {p.ncm && <p className="text-[9px] text-slate-400">NCM: {p.ncm}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-bold capitalize">
                            {p.tipo_produto?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-bold">{p.unidade_medida}</td>
                        <td className="px-4 py-3">
                          <span className={`font-black ${semEstoque ? 'text-red-600' : abaixoMin ? 'text-orange-600' : 'text-slate-800'}`}>
                            {fmtQtd(p.saldo ?? 0)}
                          </span>
                          {abaixoMin && <p className="text-[8px] text-orange-500 font-bold">Mín: {fmtQtd(p.estoque_minimo)}</p>}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-600">{fmtR(p.custo_medio_ponderado)}</td>
                        <td className="px-4 py-3 font-black text-slate-800">{fmtR((p.saldo ?? 0) * (p.custo_medio_ponderado ?? 0))}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${semEstoque ? 'bg-red-50 text-red-600 border-red-100' : abaixoMin ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                            {semEstoque ? 'Zerado' : abaixoMin ? 'Baixo' : 'Normal'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* KARDEX */}
      {sub === 'kardex' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <select value={produtoKardex} onChange={e => { setProdutoKardex(e.target.value); fetchMovimentacoes(e.target.value) }}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none shadow-sm">
              <option value="">-- Todos os Produtos --</option>
              {produtos.map((p: any) => <option key={p.id} value={p.id}>{p.codigo_interno} — {p.descricao}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {movFiltradas.length === 0 ? (
              <div className="flex flex-col items-center py-16">
                <p className="text-xs font-bold text-slate-400">Nenhuma movimentação encontrada</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {['Data', 'Produto', 'Tipo', 'Natureza', 'Qtd', 'Custo Unit.', 'Saldo Ant.', 'Saldo Atual', 'CMP', 'Histórico'].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movFiltradas.slice(0, 100).map((m: any) => {
                    const prod = produtos.find((p: any) => p.id === m.produto_id)
                    const isEntrada = m.tipo_mov === 'ENTRADA'
                    return (
                      <tr key={m.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2.5 text-slate-500 font-bold whitespace-nowrap">
                          {m.data_movimento ? new Date(m.data_movimento + 'T12:00:00').toLocaleDateString('pt-BR') : '--'}
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-slate-700 text-[10px] max-w-[140px] truncate">{prod?.descricao || m.produto_id.slice(0, 8)}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`flex items-center gap-1 text-[9px] font-black ${isEntrada ? 'text-emerald-600' : m.tipo_mov === 'AJUSTE' ? 'text-blue-600' : 'text-red-600'}`}>
                            {isEntrada ? <ArrowDown size={10} /> : <ArrowUp size={10} />} {m.tipo_mov}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-[9px] text-slate-500 capitalize">{m.natureza?.replace(/_/g, ' ')}</td>
                        <td className={`px-3 py-2.5 font-black ${isEntrada ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isEntrada ? '+' : '-'}{fmtQtd(m.quantidade)}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-slate-600">{fmtR(m.custo_unitario)}</td>
                        <td className="px-3 py-2.5 text-slate-500">{fmtQtd(m.saldo_qtd_antes ?? 0)}</td>
                        <td className="px-3 py-2.5 font-black text-slate-800">{fmtQtd(m.saldo_qtd_depois ?? 0)}</td>
                        <td className="px-3 py-2.5 text-slate-600">{fmtR(m.cmp_depois ?? 0)}</td>
                        <td className="px-3 py-2.5 text-[9px] text-slate-400 max-w-[160px] truncate">{m.historico}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* BAIXAS */}
      {sub === 'baixas' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button onClick={() => setShowNovaBaixa(!showNovaBaixa)}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all">
              <Plus size={14} /> Nova Requisição de Saída
            </button>
          </div>

          {showNovaBaixa && (
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <h4 className="text-sm font-black text-slate-700 mb-3">Nova Requisição / Baixa de Estoque</h4>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Tipo de Saída</label>
                  <select value={novaBaixa.tipo} onChange={e => setNovaBaixa(b => ({ ...b, tipo: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none">
                    <option value="consumo_interno">Consumo Interno</option>
                    <option value="distribuicao_associado">Distribuição ao Associado</option>
                    <option value="insumo_projeto">Insumo de Projeto</option>
                    <option value="devolucao_fornecedor">Devolução ao Fornecedor</option>
                    <option value="ajuste_inventario">Ajuste de Inventário</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Solicitante</label>
                  <input type="text" value={novaBaixa.solicitante} onChange={e => setNovaBaixa(b => ({ ...b, solicitante: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none" />
                </div>
                {novaBaixa.tipo === 'distribuicao_associado' && (
                  <div className="col-span-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Nome do Beneficiário</label>
                    <input type="text" value={novaBaixa.beneficiario_nome} onChange={e => setNovaBaixa(b => ({ ...b, beneficiario_nome: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none" />
                  </div>
                )}
                {novaBaixa.tipo === 'insumo_projeto' && (
                  <div className="col-span-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Projeto</label>
                    <input type="text" value={novaBaixa.projeto_ref} onChange={e => setNovaBaixa(b => ({ ...b, projeto_ref: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none" />
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-3">
                {itensBaixa.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select value={item.produtoId} onChange={e => setItensBaixa(prev => prev.map((it, i) => i === idx ? { ...it, produtoId: e.target.value } : it))}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none">
                      <option value="">Selecionar produto...</option>
                      {produtos.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.descricao} (Saldo: {fmtQtd(p.saldo ?? 0)} {p.unidade_medida})</option>
                      ))}
                    </select>
                    <input type="number" min="0.001" step="0.001" value={item.quantidade}
                      onChange={e => setItensBaixa(prev => prev.map((it, i) => i === idx ? { ...it, quantidade: Number(e.target.value) } : it))}
                      className="w-24 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" />
                    <button onClick={() => setItensBaixa(prev => prev.filter((_, i) => i !== idx))}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl">✕</button>
                  </div>
                ))}
                <button onClick={() => setItensBaixa(prev => [...prev, { produtoId: '', quantidade: 1 }])}
                  className="text-xs font-black text-blue-600 hover:underline">+ Adicionar item</button>
              </div>

              <div className="flex gap-2">
                <button onClick={handleCriarBaixa} className="px-5 py-2 text-xs font-black text-white bg-emerald-600 rounded-xl">Registrar Saída</button>
                <button onClick={() => setShowNovaBaixa(false)} className="px-5 py-2 text-xs font-black text-slate-500 bg-slate-100 rounded-xl">Cancelar</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {baixas.length === 0 ? (
              <div className="flex flex-col items-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                <p className="text-xs font-bold text-slate-400">Nenhuma requisição registrada</p>
              </div>
            ) : baixas.map((b: any) => (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-800">{b.numero_requisicao}</p>
                    <p className="text-xs text-slate-500 capitalize">{b.tipo?.replace(/_/g, ' ')} — {b.solicitante || b.beneficiario_nome || 'Interno'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">{b.data_baixa ? new Date(b.data_baixa + 'T12:00:00').toLocaleDateString('pt-BR') : '--'}</p>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
                      {b.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
