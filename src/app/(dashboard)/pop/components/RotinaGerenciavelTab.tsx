'use client'

import React, { useState } from 'react'
import { DADOS_ROTINA_TESOUREIRO, TarefaTesoureiro } from '../rotina-tesoureiro-data'
import { Calendar, CheckCircle2, ChevronRight, Clock, GripVertical, FileText, LayoutDashboard, Wallet, CreditCard, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function RotinaGerenciavelTab() {
  const [tarefas, setTarefas] = useState<TarefaTesoureiro[]>(DADOS_ROTINA_TESOUREIRO.tarefas_iniciais)
  
  const statusColumns: TarefaTesoureiro['status'][] = ['A Fazer', 'Em Andamento', 'Concluído']

  const moverTarefa = (id: string, novoStatus: TarefaTesoureiro['status']) => {
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, status: novoStatus } : t))
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('tarefa_id', id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, status: TarefaTesoureiro['status']) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('tarefa_id')
    if (id) {
      moverTarefa(id, status)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* Header Info - Rotina */}
      <div className="bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-white/60 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h2 className="text-xl font-black text-slate-800 mb-2">Rotina Semanal e Atribuições</h2>
          <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            <div className="flex items-center gap-2"><Clock size={16} className="text-emerald-500"/> {DADOS_ROTINA_TESOUREIRO.capa.horario}</div>
            <div className="flex items-center gap-2"><Calendar size={16} className="text-emerald-500"/> {DADOS_ROTINA_TESOUREIRO.capa.reuniao}</div>
            <div className="flex items-center gap-2"><FileText size={16} className="text-emerald-500"/> Base: {DADOS_ROTINA_TESOUREIRO.capa.normativa}</div>
          </div>
        </div>
        
        {/* Atalhos Rápidos */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/resumo" className="flex items-center gap-2 bg-[#0e2d22] text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-900 transition-colors">
            <LayoutDashboard size={16}/>
            Dashboard
          </Link>
          <Link href="/financeiro" className="flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-200 transition-colors">
            <Wallet size={16}/>
            Financeiro
          </Link>
          <Link href="/financeiro?tab=inadimplencia" className="flex items-center gap-2 bg-rose-100 text-rose-800 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-rose-200 transition-colors">
            <CreditCard size={16}/>
            Inadimplência
          </Link>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statusColumns.map(status => (
          <div 
            key={status}
            className="bg-slate-100/50 rounded-[24px] p-4 flex flex-col gap-4 min-h-[400px] border border-slate-200/50"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center justify-between px-2">
              <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs flex items-center gap-2">
                {status === 'A Fazer' && <div className="w-2 h-2 rounded-full bg-slate-400" />}
                {status === 'Em Andamento' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                {status === 'Concluído' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                {status}
              </h3>
              <span className="text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md shadow-sm border border-slate-100">
                {tarefas.filter(t => t.status === status).length}
              </span>
            </div>

            <div className="flex flex-col gap-3 flex-1">
              {tarefas.filter(t => t.status === status).map(tarefa => (
                <div 
                  key={tarefa.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, tarefa.id)}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-emerald-200 transition-all group flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">
                      {tarefa.bloco}
                    </span>
                    <GripVertical size={14} className="text-slate-300 group-hover:text-slate-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 leading-snug">
                    {tarefa.atividade}
                  </p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                    <span className="text-[10px] font-bold text-slate-400">
                      {tarefa.periodicidade}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider" title="Base Normativa">
                      {tarefa.base_normativa}
                    </span>
                  </div>
                </div>
              ))}
              
              {tarefas.filter(t => t.status === status).length === 0 && (
                <div className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 text-sm font-medium">
                  Solte as tarefas aqui
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
