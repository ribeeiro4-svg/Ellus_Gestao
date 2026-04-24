import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Calendar, Calculator, Info, Building2, AlertTriangle, Loader2, Settings } from 'lucide-react'
import { getAtivosAction, upsertAtivoAction, processarDepreciacaoMensalAction, getParametrosAction, upsertParametrosAction } from '../actions/imobilizadoActions'

const fmtR = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export default function Imobilizado({ planoHook }: { planoHook: any }) {
  const { contas } = planoHook
  const [ativos, setAtivos] = useState<any[]>([])
  const [parametros, setParametros] = useState<any>({ regime_tributario: 'imune' })
  const [loading, setLoading] = useState(true)
  const [processando, setProcessando] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [itemEdit, setItemEdit] = useState<any>(null)

  const load = async () => {
    setLoading(true)
    const [resAtivos, resParams] = await Promise.all([getAtivosAction(), getParametrosAction()])
    setAtivos(resAtivos.data || [])
    setParametros(resParams.data || { regime_tributario: 'imune' })
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleProcessar = async () => {
    const hoje = new Date()
    const mes = (hoje.getMonth() + 1).toString().padStart(2, '0')
    const ano = hoje.getFullYear()
    const competencia = `${ano}-${mes}-01`

    if (!confirm(`Deseja processar a depreciação de TODOS os ativos para o mês ${mes}/${ano}?\n\nEsta ação gerará os lançamentos contábeis automáticos no Livro Diário.`)) return

    setProcessando(true)
    const res = await processarDepreciacaoMensalAction(competencia)
    setProcessando(false)

    if (res.error) {
      alert(`Erro: ${res.error}`)
    } else {
      alert(`Sucesso! ${res.count} ativos depreciados.`)
      load()
    }
  }

  const handleMudarRegime = async () => {
    const novo = prompt('Selecione o Regime Tributário:\n1 - Imune\n2 - Isenta\n3 - Lucro Presumido', 
      parametros.regime_tributario === 'imune' ? '1' : (parametros.regime_tributario === 'isenta' ? '2' : '3'))
    
    let regime = ''
    if (novo === '1') regime = 'imune'
    else if (novo === '2') regime = 'isenta'
    else if (novo === '3') regime = 'lucro_presumido'
    else return

    const res = await upsertParametrosAction({ ...parametros, regime_tributario: regime })
    if (res.error) alert(res.error)
    else load()
  }

  const totais = ativos.reduce((acc, a) => {
    acc.bruto += Number(a.valor_aquisicao)
    // Aqui no futuro buscaríamos a depreciação real do log, por enquanto simulamos ou mostramos campos
    return acc
  }, { bruto: 0, acumulada: 0 })

  return (
    <div className="space-y-6">
      {/* Aviso de Regime Tributário */}
      <div className={`p-4 rounded-2xl border flex items-start gap-4 ${
        parametros.regime_tributario === 'lucro_presumido' 
        ? 'bg-amber-50 border-amber-100 text-amber-800' 
        : 'bg-indigo-50 border-indigo-100 text-indigo-800'
      }`}>
        {parametros.regime_tributario === 'lucro_presumido' ? <AlertTriangle className="flex-shrink-0" size={20} /> : <Info className="flex-shrink-0" size={20} />}
        <div className="flex-1">
          <p className="text-sm font-black">Regime Tributário: {parametros.regime_tributario.toUpperCase()}</p>
          <p className="text-[11px] font-medium opacity-80 leading-relaxed">
            {parametros.regime_tributario === 'lucro_presumido' 
              ? 'ATENÇÃO: No Lucro Presumido, a depreciação é estritamente contábil/patrimonial para fins de balanço. Ela NÃO é dedutível na apuração do IRPJ e CSLL. O sistema gerará os lançamentos contábeis normalmente para correta apuração do Patrimônio Líquido.'
              : 'As cotas de depreciação seguem as normas da ITG 2002 (R1) e NBC TG 27, afetando diretamente o superávit/déficit do exercício.'}
          </p>
        </div>
        <button 
          onClick={handleMudarRegime}
          className="p-2 hover:bg-white/50 rounded-lg transition-all text-current opacity-60 hover:opacity-100"
          title="Configurar Regime"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Valor Bruto (Imobilizado)', value: totais.bruto, color: 'text-indigo-600', icon: Building2 },
          { label: 'Depreciação Acumulada', value: totais.acumulada, color: 'text-rose-600', icon: Calculator },
          { label: 'Valor Contábil Líquido', value: totais.bruto - totais.acumulada, color: 'text-emerald-600', icon: Building2 },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon size={16} className="text-slate-300" />
            </div>
            <p className={`text-2xl font-black ${kpi.color}`}>{fmtR(kpi.value)}</p>
          </div>
        ))}
      </div>

      {/* Ações */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-800">Controle de Ativos</h2>
        <div className="flex gap-3">
          <button
            onClick={handleProcessar}
            disabled={processando || loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            {processando ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
            Calcular Depreciação do Mês
          </button>
          <button
            onClick={() => { setItemEdit(null); setModalAberto(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-md"
          >
            <Plus size={14} />
            Novo Bem
          </button>
        </div>
      </div>

      {/* Tabela de Ativos */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Cód. Patrimônio</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Descrição do Bem</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase text-center">Aquisição</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase text-right">Vl. Aquisição</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase text-right">Deprec. Mensal</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {ativos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                  Nenhum bem imobilizado cadastrado.
                </td>
              </tr>
            ) : (
              ativos.map((ativo) => (
                <tr key={ativo.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{ativo.codigo_patrimonio}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-700">{ativo.nome}</p>
                    <p className="text-[10px] text-slate-500">{ativo.conta_imobilizado?.descricao || 'Sem conta vinculada'}</p>
                  </td>
                  <td className="px-6 py-4 text-center text-xs text-slate-600 font-medium">
                    {new Date(ativo.data_aquisicao).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-bold text-slate-700">
                    {fmtR(ativo.valor_aquisicao)}
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-bold text-rose-600">
                    {fmtR((Number(ativo.valor_aquisicao) - Number(ativo.valor_residual || 0)) / ativo.vida_util_meses)}
                  </td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <button 
                      onClick={() => { setItemEdit(ativo); setModalAberto(true); }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Info size={14} />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Cadastro (Simplificado aqui para brevidade, expandiria se necessário) */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            <div className="bg-indigo-600 px-8 py-6">
              <h3 className="text-white font-black text-lg">{itemEdit ? 'Detalhes do Bem' : 'Tombamento de Novo Bem'}</h3>
              <p className="text-indigo-100 text-xs">Preencha os dados conforme a nota fiscal e laudo técnico.</p>
            </div>
            
            <form className="p-8 space-y-4" onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const dados = Object.fromEntries(formData.entries())
              
              setLoading(true)
              const res = await upsertAtivoAction({
                ...itemEdit,
                ...dados,
                valor_aquisicao: Number(dados.valor_aquisicao),
                valor_residual: Number(dados.valor_residual),
                vida_util_meses: Number(dados.vida_util_meses),
              })
              setLoading(false)
              
              if (res.error) alert(res.error)
              else {
                setModalAberto(false)
                load()
              }
            }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Cód. Patrimônio (Tombamento)</label>
                  <input name="codigo_patrimonio" defaultValue={itemEdit?.codigo_patrimonio} required className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Ex: AC-2026-001" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Data Aquisição</label>
                  <input name="data_aquisicao" type="date" defaultValue={itemEdit?.data_aquisicao} required className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Nome / Identificação</label>
                <input name="nome" defaultValue={itemEdit?.nome} required className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Ex: Notebook Dell Latitude 5420" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Valor de Aquisição</label>
                  <input name="valor_aquisicao" type="number" step="0.01" defaultValue={itemEdit?.valor_aquisicao} required className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="0,00" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Valor Residual (Não depreciável)</label>
                  <input name="valor_residual" type="number" step="0.01" defaultValue={itemEdit?.valor_residual || 0} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="0,00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Vida Útil (Meses)</label>
                  <input name="vida_util_meses" type="number" defaultValue={itemEdit?.vida_util_meses || 60} required className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                </div>
                <div className="space-y-1 flex items-end">
                  <p className="text-[9px] text-slate-400 font-medium italic">Ex: 60 meses = 5 anos (Móveis), 120 meses = 10 anos (Maquinas).</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Conta do Ativo (Tombamento)</label>
                <select name="conta_imobilizado_id" defaultValue={itemEdit?.conta_imobilizado_id} required className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none">
                  <option value="">Selecione a conta analítica...</option>
                  {contas.filter((c: any) => c.codigo.startsWith('1.2.2') && c.tipo === 'analitica' && !c.codigo.includes('1.2.2.03')).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.codigo} - {c.descricao}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Conta Deprec. Acumulada</label>
                  <select name="conta_depreciacao_acum_id" defaultValue={itemEdit?.conta_depreciacao_acum_id} required className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold focus:outline-none">
                    <option value="">Selecione...</option>
                    {contas.filter((c: any) => c.codigo.startsWith('1.2.2.03') && c.tipo === 'analitica').map((c: any) => (
                      <option key={c.id} value={c.id}>{c.codigo} - {c.descricao}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Conta Despesa Deprec.</label>
                  <select name="conta_despesa_deprec_id" defaultValue={itemEdit?.conta_despesa_deprec_id} required className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold focus:outline-none">
                    <option value="">Selecione...</option>
                    {contas.filter((c: any) => c.codigo.startsWith('4.2.4') && c.tipo === 'analitica').map((c: any) => (
                      <option key={c.id} value={c.id}>{c.codigo} - {c.descricao}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                <button type="button" onClick={() => setModalAberto(false)} className="px-6 py-2 text-xs font-black text-slate-500 hover:text-slate-700 transition-all">Cancelar</button>
                <button type="submit" disabled={loading} className="px-8 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2">
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Salvar Bem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
