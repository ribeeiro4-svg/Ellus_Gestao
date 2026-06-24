'use client'
import React, { useState, useEffect } from 'react'
import { X, Send, User, Calendar, Tag, AlertCircle, MessageSquare, Clock, Users, Edit, Check, RotateCcw, Trash2 } from 'lucide-react'
import { Tarefa, TarefaComentario } from '@/lib/types'
import { getPrioridadeColor } from '../utils/prioridade'
import { createClient } from '@/lib/supabase/client'

interface TarefaModalProps {
  isOpen: boolean
  onClose: () => void
  tarefa: Tarefa | null
  onUpdate: (id: string, data: Partial<Tarefa>) => Promise<any>
  onCopy?: (tarefa: Tarefa) => void
  buscarComentarios: (tarefaId: string) => Promise<TarefaComentario[]>
  adicionarComentario: (tarefaId: string, texto: string) => Promise<{ error: any }>
  editarComentario: (comentarioId: string, texto: string) => Promise<{ error: any }>
  excluirComentario: (comentarioId: string) => Promise<{ error: any }>
}

export default function TarefaModal({ isOpen, onClose, tarefa, onUpdate, onCopy, buscarComentarios, adicionarComentario, editarComentario, excluirComentario }: TarefaModalProps) {
  const [comentarios, setComentarios] = useState<TarefaComentario[]>([])
  const [novoComentario, setNovoComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [associadoTelefone, setAssociadoTelefone] = useState<string | null>(null)
  const sb = createClient()

  useEffect(() => {
    if (isOpen && tarefa) {
      buscarComentarios(tarefa.id).then(setComentarios)
      sb.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null))

      if (tarefa.associado_id) {
        sb.from('associados')
          .select('telefone')
          .eq('id', tarefa.associado_id)
          .single()
          .then(({ data }) => {
            setAssociadoTelefone(data?.telefone || null)
          })
      } else {
        setAssociadoTelefone(null)
      }
    }
  }, [isOpen, tarefa, buscarComentarios, sb])

  if (!tarefa) return null

  const pColor = getPrioridadeColor(tarefa.prioridade)

  const handleAddComentario = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoComentario.trim() || enviando) return
    setEnviando(true)
    const { error } = await adicionarComentario(tarefa.id, novoComentario)
    if (!error) {
      setNovoComentario('')
      const atualizados = await buscarComentarios(tarefa.id)
      setComentarios(atualizados)
    } else {
      alert('Erro ao salvar comentário: ' + (error.message || 'Erro de permissão'))
    }
    setEnviando(false)
  }

  const handleStatusChange = async (novoStatus: any) => {
    await onUpdate(tarefa.id, { status: novoStatus })
  }

  const handleEditComentario = async (id: string) => {
    if (!editText.trim() || enviando) return
    setEnviando(true)
    const { error } = await editarComentario(id, editText)
    if (!error) {
      setEditingId(null)
      const atualizados = await buscarComentarios(tarefa.id)
      setComentarios(atualizados)
    } else {
      alert('Erro ao editar comentário: ' + (error.message || 'Erro de permissão'))
    }
    setEnviando(false)
  }

  const handleDeleteComentario = async (id: string) => {
    if (!confirm('Deseja excluir este comentário permanentemente?')) return
    setEnviando(true)
    const { error } = await excluirComentario(id)
    if (!error) {
      const atualizados = await buscarComentarios(tarefa.id)
      setComentarios(atualizados)
    } else {
      alert('Erro ao excluir comentário: ' + (error.message || 'Erro de permissão'))
    }
    setEnviando(false)
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-[500px] bg-white shadow-2xl z-[101] transition-transform duration-500 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${pColor.bg} ${pColor.text} ${pColor.border}`}>
               {tarefa.prioridade}
             </div>
             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{tarefa.categoria || 'Geral'}</span>
          </div>
          <div className="flex items-center gap-2">
            {onCopy && (
              <button 
                onClick={() => onCopy(tarefa)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-black uppercase tracking-wider transition-colors mr-2 border border-emerald-150"
              >
                Copiar Dados
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
          {/* Título e Descrição */}
          <section className="space-y-4">
            <h1 className="text-2xl font-black text-slate-800 uppercase leading-tight tracking-tight">
              {tarefa.titulo}
            </h1>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {tarefa.descricao || <span className="italic text-slate-400">Sem descrição detalhada.</span>}
              </p>
            </div>
          </section>

          {/* Atributos */}
          <section className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col gap-1">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <User size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Responsável</span>
              </div>
              <span className="text-xs font-bold text-slate-700 uppercase">{tarefa.responsavel_nome}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col gap-1">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Calendar size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Prazo</span>
              </div>
              <span className="text-xs font-bold text-slate-700">
                {tarefa.prazo ? new Date(tarefa.prazo + 'T12:00:00Z').toLocaleDateString('pt-BR') : 'Sem prazo'}
              </span>
            </div>

            {(tarefa.associado_nome || tarefa.associado_id) && (
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col gap-1 col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Users size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Associado Vinculado</span>
                  </div>
                  {associadoTelefone && (
                    <a
                      href={`https://wa.me/${(() => {
                        const clean = associadoTelefone.replace(/\D/g, '')
                        return clean.startsWith('55') ? clean : `55${clean}`
                      })()}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black uppercase text-[9px] px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current inline-block">
                        <path d="M12.004 2c-5.518 0-9.998 4.493-9.998 9.997 0 1.862.518 3.661 1.5 5.245L2 22l4.93-1.282c1.517.821 3.256 1.282 5.074 1.282 5.518 0 10-4.496 10-10S17.522 2 12.004 2zm0 16.5c-1.636 0-3.2-.432-4.577-1.25L4.5 18.25l1.018-2.918c-.905-1.468-1.382-3.177-1.382-4.932 0-4.687 3.813-8.5 8.5-8.5s8.5 3.813 8.5 8.5-3.815 8.5-8.632 8.5zm4.846-6.613c-.266-.134-1.57-.775-1.813-.863-.243-.088-.42-.133-.596.134-.177.265-.685.863-.84.1.04-.154.088-.309.243-.464.154-.154.154-.265.265-.442.11-.176.055-.33-.027-.464-.082-.133-.596-1.436-.818-1.967-.215-.518-.43-.448-.596-.456-.155-.008-.33-.008-.508-.008-.176 0-.464.066-.707.33-.243.265-.928.905-.928 2.208s.95 2.56 1.083 2.737c.132.176 1.866 2.85 4.52 3.998.633.274 1.127.438 1.513.56.637.2 1.216.173 1.674.105.51-.077 1.57-.64 1.79-1.258.22-.619.22-1.149.155-1.259-.066-.11-.243-.198-.508-.33z"/>
                      </svg>
                      Chamar no WhatsApp
                    </a>
                  )}
                </div>
                <span className="text-xs font-bold text-emerald-700 uppercase mt-0.5">
                  {tarefa.associado_nome || "ID: " + tarefa.associado_id?.substring(0, 8)}
                </span>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col gap-2 col-span-2">
              <div className="flex items-center gap-2 text-slate-400">
                <AlertCircle size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Alterar Status</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['A Fazer', 'Em Andamento', 'Aguardando', 'Concluído'].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                      tarefa.status === s 
                      ? 'bg-[#0e2d22] text-white border-transparent' 
                      : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Comentários */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#0e2d22]">
              <MessageSquare size={18} />
              <h2 className="text-xs font-black uppercase tracking-[2px]">Comentários ({comentarios.length})</h2>
            </div>

            <div className="space-y-4">
              {comentarios.map((c) => (
                <div key={c.id} className="flex flex-col gap-1 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{c.autor_nome}</span>
                      {c.autor_id === currentUserId && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setEditingId(c.id); setEditText(c.texto); }}
                            className="text-slate-300 hover:text-emerald-600 transition-colors p-1"
                            title="Editar comentário"
                          >
                            <Edit size={12} />
                          </button>
                          <button 
                            onClick={() => handleDeleteComentario(c.id)}
                            className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                            title="Excluir comentário"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">{new Date(c.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  
                  {editingId === c.id ? (
                    <div className="flex flex-col gap-2 mt-1">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-white border border-emerald-200 rounded-xl p-3 text-xs font-medium text-slate-600 outline-none focus:ring-4 focus:ring-emerald-50 min-h-[80px] resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setEditingId(null)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-slate-400 hover:bg-slate-100 transition-all"
                        >
                          <RotateCcw size={10} /> Cancelar
                        </button>
                        <button 
                          onClick={() => handleEditComentario(c.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-sm"
                        >
                          <Check size={10} /> Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-[20px] rounded-tl-none transition-all group-hover:bg-emerald-50">
                      <p className="text-xs text-slate-600 leading-relaxed">{c.texto}</p>
                    </div>
                  )}
                </div>
              ))}

              {comentarios.length === 0 && (
                <div className="text-center py-8 text-slate-300">
                  <p className="text-[10px] font-bold uppercase tracking-widest italic">Nenhum comentário ainda.</p>
                </div>
              )}
            </div>

            {/* Input de Comentário */}
            <form onSubmit={handleAddComentario} className="relative mt-6 pt-6 border-t border-slate-100">
              <textarea
                placeholder="Escreva um comentário..."
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pr-14 text-xs font-medium text-slate-600 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all min-h-[100px] resize-none"
              />
              <button
                type="submit"
                disabled={!novoComentario.trim() || enviando}
                className="absolute bottom-4 right-4 w-10 h-10 rounded-xl bg-[#0e2d22] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
              >
                <Send size={16} />
              </button>
            </form>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-2 text-slate-400">
             <Clock size={12} />
             <span className="text-[9px] font-black uppercase tracking-widest">Criada em {new Date(tarefa.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </>
  )
}
