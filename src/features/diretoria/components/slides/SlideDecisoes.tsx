'use client'
import React, { useState, useEffect } from 'react'
import { ClipboardList, Plus, Trash2 } from 'lucide-react'

const HEX_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.5'/%3E%3Cpath d='M28 100L0 84V52l28-16 28 16v32L28 100z' fill='none' stroke='%2334d399' stroke-width='1.0' stroke-opacity='0.4'/%3E%3C/svg%3E")`

const STORAGE_KEY = 'ellus_decisoes_diretoria'

export default function SlideDecisoes() {
  const [decisoes, setDecisoes] = useState<string[]>([])
  const [novaDecisao, setNovaDecisao] = useState('')
  const [editingIdx, setEditingIdx] = useState<number | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try { setDecisoes(JSON.parse(saved)) } catch {}
    } else {
      setDecisoes([
        'Aprovação do orçamento do mês seguinte',
        'Revisão da meta de arrecadação',
        'Ações de cobrança para inadimplentes'
      ])
    }
  }, [])

  const saveDecisoes = (list: string[]) => {
    setDecisoes(list)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }

  const addDecisao = () => {
    if (!novaDecisao.trim()) return
    saveDecisoes([...decisoes, novaDecisao.trim()])
    setNovaDecisao('')
  }

  const removeDecisao = (idx: number) => {
    saveDecisoes(decisoes.filter((_, i) => i !== idx))
  }

  const updateDecisao = (idx: number, val: string) => {
    const copy = [...decisoes]
    copy[idx] = val
    saveDecisoes(copy)
  }

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-[#040d0a] p-10">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: HEX_PATTERN, backgroundSize: '56px 100px' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-sky-500/3 via-transparent to-transparent" />

      <div className="relative z-10 flex flex-col h-full gap-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[3px] text-sky-400/70">Fechamento com Ação</p>
            <h2 className="text-3xl font-black text-white tracking-tight">Decisões & Próximos Passos</h2>
            <p className="text-sm text-white/30 font-semibold mt-1">Pontos que exigem deliberação da diretoria</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20">
            <ClipboardList size={14} className="text-sky-400" />
            <span className="text-[10px] font-black text-sky-400 uppercase tracking-wider">{decisoes.length} itens</span>
          </div>
        </div>

        {/* Lista de decisões */}
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1">
          {decisoes.map((d, i) => (
            <div key={i} className="group flex items-start gap-3 p-4 rounded-[18px] bg-white/5 border border-white/8 hover:bg-white/8 transition-all">
              <div className="w-7 h-7 rounded-xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center text-[11px] font-black text-sky-400 shrink-0 mt-0.5">
                {i + 1}
              </div>
              {editingIdx === i ? (
                <input
                  className="flex-1 bg-transparent text-white/80 text-sm font-bold outline-none border-b border-white/20 pb-0.5"
                  value={d}
                  onChange={e => updateDecisao(i, e.target.value)}
                  onBlur={() => setEditingIdx(null)}
                  autoFocus
                />
              ) : (
                <p
                  className="flex-1 text-sm font-bold text-white/70 cursor-text"
                  onClick={() => setEditingIdx(i)}
                >
                  {d}
                </p>
              )}
              <button
                onClick={() => removeDecisao(i)}
                className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400/70 hover:text-rose-400 transition-all shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Adicionar nova decisão */}
        <div className="flex items-center gap-3 p-4 rounded-[18px] bg-white/3 border border-white/8">
          <input
            type="text"
            value={novaDecisao}
            onChange={e => setNovaDecisao(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addDecisao() }}
            placeholder="Adicionar ponto de pauta..."
            className="flex-1 bg-transparent text-sm font-bold text-white/60 placeholder:text-white/20 outline-none"
          />
          <button
            onClick={addDecisao}
            className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center text-sky-400 hover:bg-sky-500/25 transition-all"
          >
            <Plus size={16} />
          </button>
        </div>

        <p className="text-[10px] text-white/20 font-bold text-center">
          Clique em qualquer item para editar · Itens salvos automaticamente para a próxima reunião
        </p>
      </div>
    </div>
  )
}
