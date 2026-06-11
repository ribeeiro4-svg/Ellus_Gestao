'use client'

import React, { useState } from 'react'
import { useColaboradores, usePerfis } from '@/lib/hooks/useRBAC'
import { useDiretoria } from '@/lib/hooks/useDiretoria'

import { Plus, Search, Edit2, Shield, UserX, UserCheck, ChevronDown, Users, Activity, Key, Trash2 } from "lucide-react"

export default function ColaboradoresPage() {
  return <ColaboradoresContent />
}

function ColaboradoresContent() {
  const { colaboradores, loading: loadingColab, inserir, atualizar, alterarStatus, excluir } = useColaboradores()
  const { perfis } = usePerfis()
  const { diretoria, loading: loadingDir } = useDiretoria()
  
  const loading = loadingColab || loadingDir

  const [busca, setBusca] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [perfilId, setPerfilId] = useState('')
  const [status, setStatus] = useState('ativo')
  
  const combinedList = React.useMemo(() => {
    const list: any[] = colaboradores.map((c: any) => ({ ...c, tipoOrigem: 'colaborador' }))
    
    diretoria.forEach(d => {
      const isAlreadyColab = list.some((c: any) => c.email === d.email || c.nome.toLowerCase() === d.nome.toLowerCase())
      if (!isAlreadyColab) {
        list.push({
          id: `dir-${d.id}`, // pseudo id
          nome: d.nome,
          email: d.email || '',
          perfis: null,
          status: 'sem_acesso',
          tipoOrigem: 'diretoria',
          diretoria_id: d.id
        })
      }
    })
    
    return list.sort((a, b) => a.nome.localeCompare(b.nome))
  }, [colaboradores, diretoria])

  const filtered = combinedList.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase()) || 
    c.email.toLowerCase().includes(busca.toLowerCase())
  )

  const openModal = (colab?: any) => {
    if (colab && colab.tipoOrigem === 'colaborador') {
      setEditingId(colab.id)
      setNome(colab.nome)
      setEmail(colab.email)
      setPerfilId(colab.perfis?.id?.toString() || '')
      setStatus(colab.status)
      setSenha('') // Edit doesn't allow changing password here
    } else if (colab && colab.tipoOrigem === 'diretoria') {
      setEditingId(null)
      setNome(colab.nome)
      setEmail(colab.email)
      setSenha('')
      setPerfilId('')
      setStatus('ativo')
    } else {
      setEditingId(null)
      setNome('')
      setEmail('')
      setSenha('')
      setPerfilId('')
      setStatus('ativo')
    }
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    let res
    if (editingId) {
      res = await atualizar(editingId, { nome, email, perfil_id: parseInt(perfilId), status })
    } else {
      res = await inserir({ nome, email, senha, perfil_id: parseInt(perfilId), status })
    }

    if (res.error) {
      alert(res.error)
    } else {
      setModalOpen(false)
    }
  }

  const toggleStatus = async (colab: any) => {
    const novoStatus = colab.status === 'ativo' ? 'inativo' : 'ativo'
    if (confirm(`Deseja alterar o status para ${novoStatus}?`)) {
      await alterarStatus(colab.id, novoStatus)
    }
  }

  const handleDelete = async (colab: any) => {
    if (confirm(`Tem certeza que deseja excluir permanentemente o colaborador ${colab.nome}? O e-mail será liberado para novos cadastros.`)) {
      const res = await excluir(colab.id)
      if (res.error) {
        alert(res.error)
      }
    }
  }

  const selectedPerfil = perfis.find((p: any) => p.id.toString() === perfilId)

  return (
    <div className="flex flex-col flex-1 gap-8 animate-in fade-in duration-500 pb-20 p-8">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-white/60 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#0e2d22] flex items-center justify-center text-white shadow-lg shadow-emerald-900/20 transition-all duration-500">
            <Shield size={28} />
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1.5 px-2.5 py-1 mb-2 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100/50">
              <Shield size={10} />
              <span>SEGURANÇA DE DADOS</span>
              <ChevronDown size={10} className="opacity-50 ml-1" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">Colaboradores (RBAC)</h1>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-70 mt-1">Controle de Acesso Interno</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex bg-slate-100/60 p-1.5 rounded-[22px] items-center gap-1 border border-slate-200/40 backdrop-blur-sm shadow-inner">
            <a href="/configuracoes/colaboradores" className="flex items-center gap-2 px-4 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-wider transition-all duration-500 bg-white text-emerald-700 shadow-md shadow-slate-200/50 scale-100">
              <Users size={14} className="text-emerald-500" />
              Colaboradores
            </a>
            <a href="/configuracoes/perfis" className="flex items-center gap-2 px-4 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-wider transition-all duration-500 text-slate-500 hover:bg-white/50 hover:text-slate-700 scale-95 hover:scale-100">
              <Shield size={14} className="opacity-70" />
              Perfis
            </a>
            <a href="/auditoria" className="flex items-center gap-2 px-4 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-wider transition-all duration-500 text-slate-500 hover:bg-white/50 hover:text-slate-700 scale-95 hover:scale-100">
              <Activity size={14} className="opacity-70" />
              Auditoria
            </a>
          </div>
          <button onClick={() => openModal()} className="btn-primary text-xs uppercase font-black px-6 py-3 flex items-center gap-2 bg-[#0e2d22] hover:bg-[#1a4a38] text-white rounded-xl shadow-lg shadow-emerald-900/30">
            <Plus size={16} /> Novo Colaborador
          </button>
        </div>
      </div>

      <div className="table-card p-10 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="flex justify-between items-center mb-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou e-mail..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-400 text-sm font-medium">Carregando...</div>
        ) : (
          <div className="overflow-hidden border border-slate-100 rounded-3xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome / E-mail</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Perfil</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm font-black text-slate-800">
                        {c.nome}
                        {c.tipoOrigem === 'diretoria' && <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-widest font-black">Diretoria</span>}
                      </div>
                      <div className="text-[11px] text-slate-500">{c.email || 'Sem e-mail'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">
                        {c.perfis?.nome || '--'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${
                        c.status === 'ativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                        c.status === 'inativo' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                        'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {c.status === 'sem_acesso' ? 'Sem Acesso' : c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      {c.tipoOrigem === 'colaborador' ? (
                        <>
                          <button onClick={() => openModal(c)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Editar Colaborador">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => toggleStatus(c)} className={`w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 transition-colors ${
                            c.status === 'ativo' ? 'text-slate-500 hover:bg-rose-50 hover:text-rose-600' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
                          }`} title={c.status === 'ativo' ? 'Desativar' : 'Ativar'}>
                            {c.status === 'ativo' ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                          <button onClick={() => handleDelete(c)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Excluir Colaborador">
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => openModal(c)} className="px-3 h-8 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors text-[10px] font-black uppercase tracking-widest" title="Atribuir Senha e Perfil">
                          <Key size={12} />
                          Criar Acesso
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">{editingId ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Nome Completo</span>
                  <input type="text" required value={nome} onChange={e => setNome(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-colors" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">E-mail</span>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-colors" />
                </label>
              </div>

              {!editingId && (
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Senha Inicial</span>
                    <input type="password" required={!editingId} value={senha} onChange={e => setSenha(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-colors" />
                  </label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Perfil de Acesso</span>
                  <select required value={perfilId} onChange={e => setPerfilId(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-colors">
                    <option value="">Selecione...</option>
                    {perfis.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Status</span>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-colors">
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </label>
              </div>

              {selectedPerfil && (
                <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Prévia de Permissões ({selectedPerfil.nome})</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedPerfil.permissoes?.map((perm: any) => (
                      <div key={perm.modulo} className="flex justify-between items-center text-xs p-2 bg-white rounded-lg border border-slate-100">
                        <span className="font-bold uppercase text-slate-700">{perm.modulo}</span>
                        <div className="flex gap-2 text-[9px] font-black text-slate-400">
                          {perm.pode_ver && <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Ver</span>}
                          {perm.pode_criar && <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Criar</span>}
                          {perm.pode_editar && <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Editar</span>}
                          {perm.pode_excluir && <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Excluir</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="w-full py-4 mt-4 bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-colors shadow-lg">
                {editingId ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
