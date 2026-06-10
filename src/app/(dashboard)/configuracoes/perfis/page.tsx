'use client'

import React, { useState } from 'react'
import { usePerfis } from '@/lib/hooks/useRBAC'

import { Shield, Key, Save, ChevronDown, Users, Activity, Plus, X, Loader2, Pencil, Trash2, AlertTriangle } from "lucide-react"

export default function PerfisPage() {
  return <PerfisContent />
}

function PerfisContent() {
  const { perfis, loading, atualizarPermissoes, excluir, editar, refresh } = usePerfis()
  
  const [selectedPerfil, setSelectedPerfil] = useState<any>(null)
  const [permissoesEditaveis, setPermissoesEditaveis] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [showNovoPerfil, setShowNovoPerfil] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoDesc, setNovoDesc] = useState('')
  const [criando, setCriando] = useState(false)
  const [showEditPerfil, setShowEditPerfil] = useState(false)
  const [editNome, setEditNome] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editando, setEditando] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  const handleCriarPerfil = async () => {
    if (!novoNome.trim()) return
    setCriando(true)
    try {
      const res = await fetch('/api/perfis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novoNome.trim(), descricao: novoDesc.trim(), permissoes: [] })
      })
      const data = await res.json()
      if (!res.ok) { alert(data.erro || 'Erro ao criar perfil'); return }
      await refresh()
      setShowNovoPerfil(false)
      setNovoNome('')
      setNovoDesc('')
      handleSelectPerfil(data)
    } finally {
      setCriando(false)
    }
  }

  const handleEditarPerfil = async () => {
    if (!editNome.trim() || !selectedPerfil) return
    setEditando(true)
    const res = await editar(selectedPerfil.id.toString(), { nome: editNome.trim(), descricao: editDesc.trim() })
    setEditando(false)
    if (res.error) { alert(res.error); return }
    setShowEditPerfil(false)
    setSelectedPerfil((prev: any) => ({ ...prev, nome: editNome.trim(), descricao: editDesc.trim() }))
  }

  const handleExcluirPerfil = async () => {
    if (!selectedPerfil) return
    setExcluindo(true)
    const res = await excluir(selectedPerfil.id.toString())
    setExcluindo(false)
    if (res.error) { alert(res.error); return }
    setShowConfirmDelete(false)
    setSelectedPerfil(null)
    setPermissoesEditaveis([])
  }

  const handleSelectPerfil = (perfil: any) => {
    setSelectedPerfil(perfil)
    // Clonar as permissões
    setPermissoesEditaveis(JSON.parse(JSON.stringify(perfil.permissoes || [])))
  }

  const togglePermission = (modulo: string, acao: string) => {
    if (selectedPerfil.id === 1) return // Admin não pode ser alterado
    
    setPermissoesEditaveis(prev => {
      const copy = [...prev]
      const permIndex = copy.findIndex(p => p.modulo === modulo)
      if (permIndex > -1) {
        copy[permIndex] = { ...copy[permIndex], [acao]: !copy[permIndex][acao] }
      } else {
        copy.push({
          modulo,
          pode_ver: acao === 'pode_ver',
          pode_criar: acao === 'pode_criar',
          pode_editar: acao === 'pode_editar',
          pode_excluir: acao === 'pode_excluir'
        })
      }
      return copy
    })
  }

  const getPerm = (modulo: string, acao: string) => {
    const perm = permissoesEditaveis.find((p: any) => p.modulo === modulo)
    return perm ? !!perm[acao] : false
  }

  const handleSave = async () => {
    if (!selectedPerfil || selectedPerfil.id === 1) return
    setSaving(true)
    const res = await atualizarPermissoes(selectedPerfil.id.toString(), permissoesEditaveis)
    setSaving(false)
    if (res.error) {
      console.error('Erro ao salvar permissões:', res.error)
      alert(`Erro ao salvar permissões: ${res.error}`)
    } else {
      alert('Permissões salvas com sucesso!')
      // Recarregar o perfil selecionado com os dados atualizados
      setSelectedPerfil((prev: any) => ({ ...prev, permissoes: permissoesEditaveis }))
    }
  }

  const modulos = [
    // ── Financeiro ──
    { chave: 'financeiro', label: 'Financeiro', secao: 'Financeiro' },
    { chave: 'cobrancas', label: 'Cobranças', secao: 'Financeiro' },
    { chave: 'planejamento', label: 'Planejamento', secao: 'Financeiro' },
    { chave: 'fechamento', label: 'Fechamento Mensal', secao: 'Financeiro' },
    // ── Vidas ──
    { chave: 'socios', label: 'Gestão de Vidas', secao: 'Vidas' },
    { chave: 'atendimentos', label: 'Atendimentos', secao: 'Vidas' },
    { chave: 'plano_saude', label: 'Plano de Saúde', secao: 'Vidas' },
    // ── Gerencial ──
    { chave: 'estrategia', label: 'Metas e Projetos', secao: 'Gerencial' },
    { chave: 'gestao_tarefas', label: 'Gestão de Tarefas', secao: 'Gerencial' },
    { chave: 'bens_duraveis', label: 'Bens Duráveis', secao: 'Gerencial' },
    // ── Recrutamento ──
    { chave: 'recrutamento', label: 'Recrutamento', secao: 'Recrutamento' },
    // ── Fiscal & Contábil ──
    { chave: 'fiscal', label: 'Escrituração Fiscal', secao: 'Fiscal & Contábil' },
    { chave: 'contabil', label: 'Contabilidade', secao: 'Fiscal & Contábil' },
    // ── Dados ──
    { chave: 'importar', label: 'Importar Dados', secao: 'Dados' },
    { chave: 'relatorios', label: 'Relatórios', secao: 'Dados' },
    // ── Administração ──
    { chave: 'configuracoes', label: 'Configurações', secao: 'Administração' },
    { chave: 'auditoria', label: 'Auditoria', secao: 'Administração' },
  ]

  return (
    <>
    <div className="flex flex-col flex-1 gap-8 animate-in fade-in duration-500 pb-20 p-8">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-white/60 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#0e2d22] flex items-center justify-center text-white shadow-lg shadow-emerald-900/20 transition-all duration-500">
            <Key size={28} />
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5 px-2.5 py-1 mb-2 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100/50">
              <Shield size={10} />
              <span>SEGURANÇA DE DADOS</span>
              <ChevronDown size={10} className="opacity-50 ml-1" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">Perfis de Acesso</h1>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-70 mt-1">Gerenciamento de Permissões</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex bg-slate-100/60 p-1.5 rounded-[22px] items-center gap-1 border border-slate-200/40 backdrop-blur-sm shadow-inner">
            <a href="/configuracoes/colaboradores" className="flex items-center gap-2 px-4 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-wider transition-all duration-500 text-slate-500 hover:bg-white/50 hover:text-slate-700 scale-95 hover:scale-100">
              <Users size={14} className="opacity-70" />
              Colaboradores
            </a>
            <a href="/configuracoes/perfis" className="flex items-center gap-2 px-4 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-wider transition-all duration-500 bg-white text-emerald-700 shadow-md shadow-slate-200/50 scale-100">
              <Shield size={14} className="text-emerald-500" />
              Perfis
            </a>
            <a href="/auditoria" className="flex items-center gap-2 px-4 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-wider transition-all duration-500 text-slate-500 hover:bg-white/50 hover:text-slate-700 scale-95 hover:scale-100">
              <Activity size={14} className="opacity-70" />
              Auditoria
            </a>
          </div>
          <button
            onClick={() => setShowNovoPerfil(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0e2d22] text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 transition-all shadow-lg shadow-emerald-900/20"
          >
            <Plus size={14} /> Novo Perfil
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="table-card p-8 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col gap-4">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Selecione o Perfil</h2>
          {loading ? (
            <div className="text-slate-400 text-sm">Carregando...</div>
          ) : (
            perfis.map((p: any) => (
              <div
                key={p.id}
                className={`p-4 rounded-2xl border transition-all group relative ${
                  selectedPerfil?.id === p.id 
                  ? 'bg-indigo-50 border-indigo-200 shadow-sm ring-1 ring-indigo-500/20' 
                  : 'bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-200'
                }`}
              >
                <button onClick={() => handleSelectPerfil(p)} className="text-left w-full">
                  <div className="text-sm font-black text-slate-800">{p.nome}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">{p.descricao || '—'}</div>
                </button>
                {p.id !== 1 && (
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSelectPerfil(p); setEditNome(p.nome); setEditDesc(p.descricao || ''); setShowEditPerfil(true) }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Editar"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSelectPerfil(p); setShowConfirmDelete(true) }}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-2 table-card p-10 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40">
          {!selectedPerfil ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
              <Shield size={48} className="opacity-20" />
              <p className="text-sm font-black uppercase tracking-widest">Selecione um perfil para ver as permissões</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8 h-full">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Permissões: {selectedPerfil.nome}</h2>
                  {selectedPerfil.id === 1 && (
                    <p className="text-xs text-rose-500 font-bold uppercase tracking-widest mt-1">O perfil administrador não pode ser alterado.</p>
                  )}
                </div>
                {selectedPerfil.id !== 1 && (
                  <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="btn-primary text-xs uppercase font-black px-6 py-3 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                  >
                    <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                )}
              </div>

              <div className="overflow-hidden border border-slate-100 rounded-3xl">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Módulo</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ver</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Criar</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Editar</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Excluir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {modulos.map((modulo, index) => {
                      const showSection = index === 0 || modulo.secao !== modulos[index - 1].secao;
                      return (
                        <React.Fragment key={modulo.chave}>
                          {showSection && (
                            <tr className="bg-slate-50/30">
                              <td colSpan={5} className="px-6 py-2 text-[9px] font-black text-slate-400 uppercase tracking-[2px] bg-slate-100/50">
                                {modulo.secao}
                              </td>
                            </tr>
                          )}
                          <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-black text-slate-700 uppercase tracking-tight">{modulo.label}</td>
                            {(['pode_ver', 'pode_criar', 'pode_editar', 'pode_excluir'] as const).map(acao => {
                              const checked = getPerm(modulo.chave, acao)
                              const isAdmin = selectedPerfil.id === 1
                              return (
                                <td key={acao} className="px-6 py-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => !isAdmin && togglePermission(modulo.chave, acao)}
                                    aria-label={`${acao} ${modulo.chave}`}
                                    aria-checked={checked}
                                    role="checkbox"
                                    className={[
                                      'inline-flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1',
                                      isAdmin
                                        ? 'opacity-40 cursor-not-allowed border-slate-200 bg-slate-50'
                                        : checked
                                          ? 'bg-indigo-600 border-indigo-600 cursor-pointer hover:bg-indigo-700 hover:border-indigo-700 shadow-sm shadow-indigo-200 focus:ring-indigo-400'
                                          : 'bg-white border-slate-300 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 focus:ring-indigo-300'
                                    ].join(' ')}
                                  >
                                    {checked && (
                                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    )}
                                  </button>
                                </td>
                              )
                            })}
                          </tr>
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Modal: Novo Perfil */}
      {showNovoPerfil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md p-10 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-800">Novo Perfil de Acesso</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Defina as permissões após criar o perfil.</p>
              </div>
              <button onClick={() => setShowNovoPerfil(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do Perfil *</label>
                <input
                  type="text"
                  value={novoNome}
                  onChange={e => setNovoNome(e.target.value)}
                  placeholder="Ex: Recepcionista, Atendente..."
                  className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500/30 transition-all outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição</label>
                <input
                  type="text"
                  value={novoDesc}
                  onChange={e => setNovoDesc(e.target.value)}
                  placeholder="Ex: Acesso somente à agenda de atendimentos"
                  className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500/30 transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowNovoPerfil(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCriarPerfil}
                disabled={criando || !novoNome.trim()}
                className="flex-1 py-3 bg-[#0e2d22] hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {criando ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {criando ? 'Criando...' : 'Criar Perfil'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Editar Perfil */}
      {showEditPerfil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md p-10 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-800">Editar Perfil</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Altere o nome ou descrição do perfil.</p>
              </div>
              <button onClick={() => setShowEditPerfil(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do Perfil *</label>
                <input
                  type="text"
                  value={editNome}
                  onChange={e => setEditNome(e.target.value)}
                  className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500/30 transition-all outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descrição</label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-emerald-500/30 transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowEditPerfil(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditarPerfil}
                disabled={editando || !editNome.trim()}
                className="flex-1 py-3 bg-[#0e2d22] hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {editando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão */}
      {showConfirmDelete && selectedPerfil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center gap-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-2">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Excluir Perfil?</h2>
              <p className="text-sm text-slate-500 font-medium mt-2">
                Tem certeza que deseja excluir o perfil <strong className="text-slate-800">{selectedPerfil.nome}</strong>?
                Esta ação apagará todas as permissões vinculadas a ele.
              </p>
            </div>

            <div className="flex w-full gap-3 mt-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluirPerfil}
                disabled={excluindo}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-red-500/30 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {excluindo ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {excluindo ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

