'use client'
import React, { useState, useEffect } from 'react'
import { X, Save, Calendar as CalendarIcon, MessageCircle, AlertTriangle, AlertCircle, CheckCircle2, Trash2, Edit2 } from 'lucide-react'
import { CalendarioNota, DiaCalendario } from '@/lib/hooks/useConciliacaoCalendario'
import { fmtData } from '@/lib/utils/formatters'

interface CalendarioNotaDrawerProps {
  isOpen: boolean
  onClose: () => void
  data: string | null
  notasExistentes: CalendarioNota[]
  diaInfo?: DiaCalendario
  onSaveNotas: (notas: CalendarioNota[]) => void
}

export default function CalendarioNotaDrawer({ isOpen, onClose, data, notasExistentes, diaInfo, onSaveNotas }: CalendarioNotaDrawerProps) {
  const [notas, setNotas] = useState<CalendarioNota[]>([])
  const [novaNota, setNovaNota] = useState('')
  const [novoTipo, setNovoTipo] = useState<'observacao' | 'alerta' | 'pendencia'>('observacao')
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen) {
      setNotas(notasExistentes)
      setNovaNota('')
      setNovoTipo('observacao')
      setEditandoIndex(null)
    }
  }, [isOpen, notasExistentes])

  if (!isOpen || !data) return null

  const handleAddOuUpdate = () => {
    if (!novaNota.trim()) return

    const nota: CalendarioNota = {
      id: editandoIndex !== null && notas[editandoIndex]?.id ? notas[editandoIndex].id : Math.random().toString(36).substring(7),
      tipo: novoTipo,
      texto: novaNota,
      resolvido: false,
      criado_em: editandoIndex !== null && notas[editandoIndex]?.criado_em ? notas[editandoIndex].criado_em : new Date().toISOString(),
    }

    let updatedNotas = [...notas]
    if (editandoIndex !== null) {
      updatedNotas[editandoIndex] = nota
    } else {
      updatedNotas.push(nota)
    }

    setNotas(updatedNotas)
    onSaveNotas(updatedNotas)
    setNovaNota('')
    setNovoTipo('observacao')
    setEditandoIndex(null)
  }

  const handleDelete = (index: number) => {
    if (!confirm('Deseja excluir esta nota?')) return
    const updated = notas.filter((_, i) => i !== index)
    setNotas(updated)
    onSaveNotas(updated)
  }

  const handleToggleResolvido = (index: number) => {
    const updated = [...notas]
    updated[index].resolvido = !updated[index].resolvido
    setNotas(updated)
    onSaveNotas(updated)
  }

  const handleEdit = (index: number) => {
    setNovaNota(notas[index].texto)
    setNovoTipo(notas[index].tipo)
    setEditandoIndex(index)
  }

  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">Dia {fmtData(data)}</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Notas e Observações</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {diaInfo?.primeira_conciliacao_em && (
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-xs font-black uppercase tracking-widest text-emerald-700">Conciliado</span>
              </div>
              <div className="space-y-2 text-sm">
                {diaInfo.conciliado_por_nome && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-emerald-600/70 uppercase">Responsável</span>
                    <span className="text-slate-700 font-medium">{diaInfo.conciliado_por_nome} {diaInfo.conciliado_por_email ? `(${diaInfo.conciliado_por_email})` : ''}</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-emerald-600/70 uppercase">Data da Ação</span>
                  <span className="text-slate-700 font-medium">
                    {new Date(diaInfo.primeira_conciliacao_em).toLocaleDateString('pt-BR')} às {new Date(diaInfo.primeira_conciliacao_em).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                  </span>
                </div>
                {diaInfo.periodo_conciliado && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-emerald-600/70 uppercase">Período Analisado</span>
                    <span className="text-slate-700 font-medium">{diaInfo.periodo_conciliado}</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-emerald-600/70 uppercase">Houve Movimentação?</span>
                  <span className="text-slate-700 font-medium">{diaInfo.teve_transacoes === false ? 'Não' : 'Sim'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {notas.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <MessageCircle size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-400">Nenhuma observação neste dia.</p>
              </div>
            ) : (
              notas.map((nota, i) => (
                <div key={nota.id || i} className={`p-4 rounded-2xl border ${nota.tipo === 'pendencia' ? (nota.resolvido ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-rose-50 border-rose-100') : nota.tipo === 'alerta' ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {nota.tipo === 'pendencia' ? <AlertCircle size={14} className={nota.resolvido ? 'text-slate-400' : 'text-rose-500'} /> : nota.tipo === 'alerta' ? <AlertTriangle size={14} className="text-amber-500" /> : <MessageCircle size={14} className="text-blue-500" />}
                      <span className={`text-[10px] font-black uppercase tracking-widest ${nota.tipo === 'pendencia' ? (nota.resolvido ? 'text-slate-400' : 'text-rose-600') : nota.tipo === 'alerta' ? 'text-amber-600' : 'text-blue-600'}`}>
                        {nota.tipo} {nota.resolvido && '(Resolvido)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {nota.tipo === 'pendencia' && (
                        <button onClick={() => handleToggleResolvido(i)} className="p-1 hover:bg-black/5 rounded text-slate-400 hover:text-emerald-600 transition-colors" title="Marcar/Desmarcar como resolvido">
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                      <button onClick={() => handleEdit(i)} className="p-1 hover:bg-black/5 rounded text-slate-400 hover:text-blue-600 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(i)} className="p-1 hover:bg-black/5 rounded text-slate-400 hover:text-rose-600 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className={`text-sm font-medium ${nota.resolvido ? 'text-slate-500 line-through' : 'text-slate-700'}`}>{nota.texto}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <select 
              value={novoTipo} 
              onChange={(e) => setNovoTipo(e.target.value as any)}
              className="text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="observacao">Observação</option>
              <option value="alerta">Alerta</option>
              <option value="pendencia">Pendência</option>
            </select>
          </div>
          <textarea
            value={novaNota}
            onChange={(e) => setNovaNota(e.target.value)}
            placeholder="Adicionar nota para este dia..."
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none h-24"
          />
          <div className="flex justify-end gap-2">
            {editandoIndex !== null && (
              <button 
                onClick={() => { setEditandoIndex(null); setNovaNota(''); }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
              >
                Cancelar
              </button>
            )}
            <button 
              onClick={handleAddOuUpdate}
              disabled={!novaNota.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={14} /> {editandoIndex !== null ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
