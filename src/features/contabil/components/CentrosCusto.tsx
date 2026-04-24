'use client'
import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Tag, Search, Info, Loader2 } from 'lucide-react'
import { getCentrosCustoAction, upsertCentroCustoAction } from '../actions/centroCustoActions'

export default function CentrosCusto() {
  const [ccs, setCcs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [itemEdit, setItemEdit] = useState<any>(null)
  const [filtro, setFiltro] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await getCentrosCustoAction()
    setCcs(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = ccs.filter(c => 
    c.nome.toLowerCase().includes(filtro.toLowerCase()) || 
    c.codigo.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-800">Centros de Custo e Projetos</h2>
          <p className="text-xs text-slate-500 font-medium italic">Estrutura para rateio e acompanhamento por rubrica.</p>
        </div>
        <button
          onClick={() => { setItemEdit(null); setModalAberto(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-md"
        >
          <Plus size={14} />
          Novo Centro de Custo
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
        <Search size={16} className="text-slate-400" />
        <input 
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          placeholder="Buscar por nome ou código..." 
          className="bg-transparent border-none focus:outline-none text-xs font-bold text-slate-600 w-full" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 font-medium bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            Nenhum centro de custo encontrado.
          </div>
        ) : (
          filtered.map((cc) => (
            <div key={cc.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase">{cc.codigo}</span>
                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${cc.tipo === 'projeto' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                  {cc.tipo || 'Administrativo'}
                </span>
              </div>
              <p className="text-sm font-black text-slate-800 mb-1">{cc.nome}</p>
              <p className="text-[10px] text-slate-400 font-medium mb-4">{cc.descricao || 'Sem descrição'}</p>
              
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={() => { setItemEdit(cc); setModalAberto(true); }}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                >
                  <Info size={14} />
                </button>
                <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            <div className="bg-indigo-600 px-8 py-6">
              <h3 className="text-white font-black text-lg">{itemEdit ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}</h3>
              <p className="text-indigo-100 text-xs">A estrutura deve seguir o padrão do Plano de Contas.</p>
            </div>
            
            <form className="p-8 space-y-4" onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const dados = Object.fromEntries(formData.entries())
              
              setLoading(true)
              const res = await upsertCentroCustoAction({ ...itemEdit, ...dados })
              setLoading(false)
              
              if (res.error) alert(res.error)
              else {
                setModalAberto(false)
                load()
              }
            }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Código</label>
                  <input name="codigo" defaultValue={itemEdit?.codigo} required className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none" placeholder="Ex: 01.001" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Tipo</label>
                  <select name="tipo" defaultValue={itemEdit?.tipo || 'administrativo'} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none">
                    <option value="administrativo">Administrativo</option>
                    <option value="projeto">Projeto / MROSC</option>
                    <option value="operacional">Operacional</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Nome do Centro de Custo</label>
                <input name="nome" defaultValue={itemEdit?.nome} required className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none" placeholder="Ex: Sede Administrativa" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Descrição (Opcional)</label>
                <textarea name="descricao" defaultValue={itemEdit?.descricao} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none h-20" placeholder="Detalhes sobre o centro de custo..." />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                <button type="button" onClick={() => setModalAberto(false)} className="px-6 py-2 text-xs font-black text-slate-500 hover:text-slate-700 transition-all">Cancelar</button>
                <button type="submit" disabled={loading} className="px-8 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2">
                  {loading && <Loader2 size={14} className="animate-spin" /> }
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
