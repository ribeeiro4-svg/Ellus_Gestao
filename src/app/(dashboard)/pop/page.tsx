'use client'

import React, { useState } from 'react'
import { BookMarked, Search, Filter, FileText, Download, Printer, X, CheckCircle2, ChevronRight, AlertTriangle, Target, Lock } from 'lucide-react'
import { POPS, PopItem } from './pops-data'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'
import RotinaGerenciavelTab from './components/RotinaGerenciavelTab'

import { usePermissions } from '@/lib/hooks/usePermissions'

export default function POPPage() {
  const { currentUser } = useCurrentUser()
  const { isAdmin } = usePermissions('pop')
  const [busca, setBusca] = useState('')
  const [moduloSelecionado, setModuloSelecionado] = useState<string>('Todos')
  const [popAberto, setPopAberto] = useState<PopItem | null>(null)
  const [activeTab, setActiveTab] = useState<'manuais' | 'rotina'>('manuais')

  const modulos = ['Todos', ...Array.from(new Set(POPS.map(p => p.modulo))).sort()]

  const popsFiltrados = POPS.filter(pop => {
    const matchBusca = pop.titulo.toLowerCase().includes(busca.toLowerCase()) || pop.codigo.toLowerCase().includes(busca.toLowerCase())
    const matchModulo = moduloSelecionado === 'Todos' || pop.modulo === moduloSelecionado
    return matchBusca && matchModulo
  })

  const handlePrint = () => {
    window.print()
  }

  const roleSeguro = currentUser?.role?.toLowerCase() || ''
  
  // Safe check for email with lowercasing, just in case
  const isEmailSeguro = currentUser?.email?.toLowerCase() === 'ribeeiro4@gmail.com'

  const isElegibleForRotina = 
    isAdmin ||
    roleSeguro === 'admin' || 
    roleSeguro === 'administrador' ||
    roleSeguro === 'tesoureiro' || 
    isEmailSeguro

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700 pb-20">
      
      {/* Estilos para Impressão */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #pop-print-area, #pop-print-area * { visibility: visible; }
          #pop-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
          @page { size: A4; margin: 20mm; }
        }
      `}} />

      {/* Header Centralizado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-white/60 shadow-sm no-print">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#0e2d22] flex items-center justify-center text-white shadow-lg shadow-emerald-900/20 transition-all duration-500">
            <BookMarked size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Manual de Procedimentos</h1>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-70">Biblioteca de POPs — ACPROBEC</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 no-print pb-2 px-2">
        <button
          onClick={() => setActiveTab('manuais')}
          className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'manuais' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Manuais (POPs)
        </button>
        {isElegibleForRotina && (
          <button
            onClick={() => setActiveTab('rotina')}
            className={`pb-2 px-4 text-sm font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'rotina' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Lock size={14} className={activeTab === 'rotina' ? 'text-amber-500' : 'text-slate-300'}/>
            Rotina Gerenciável
          </button>
        )}
      </div>

      {activeTab === 'manuais' ? (
        <>
          {/* Barra de Filtros */}
          <div className="flex flex-col md:flex-row gap-4 no-print">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Buscar procedimento por título ou código..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-slate-700"
              />
            </div>
            <div className="relative min-w-[250px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                value={moduloSelecionado}
                onChange={e => setModuloSelecionado(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 bg-white rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium text-slate-700 appearance-none cursor-pointer"
              >
                {modulos.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

      {/* Grid de POPs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 no-print">
        {popsFiltrados.map(pop => (
          <div 
            key={pop.id}
            onClick={() => setPopAberto(pop)}
            className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group flex flex-col h-full"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="px-3 py-1 bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                {pop.codigo}
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                <FileText size={14} />
              </div>
            </div>
            
            <h3 className="text-[15px] font-bold text-slate-800 leading-snug mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2">
              {pop.titulo}
            </h3>
            
            <div className="mt-auto pt-4 border-t border-slate-50">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Módulo</p>
              <p className="text-sm font-medium text-slate-600 truncate">{pop.modulo}</p>
            </div>
          </div>
        ))}
        {popsFiltrados.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 font-medium">
            Nenhum procedimento encontrado para esta busca.
          </div>
        )}
      </div>

      {/* Drawer / Modal do POP */}
      {popAberto && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/20 backdrop-blur-sm no-print animate-in fade-in">
          <div 
            className="absolute inset-0"
            onClick={() => setPopAberto(null)}
          />
          <div className="relative w-full max-w-3xl bg-slate-50 h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right-full duration-300 flex flex-col">
            
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg mb-2 inline-block">
                  {popAberto.codigo}
                </span>
                <h2 className="text-xl font-black text-slate-800">{popAberto.titulo}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrint}
                  className="px-4 py-2 bg-[#0e2d22] text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-900 transition-all flex items-center gap-2"
                >
                  <Printer size={14} /> Gerar PDF
                </button>
                <button 
                  onClick={() => setPopAberto(null)}
                  className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-8 pb-20">
              {/* Área invisível na tela que só aparece na impressão */}
              <div id="pop-print-area" className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                
                {/* Header Impressão */}
                <div className="flex justify-between items-start border-b-2 border-[#0e2d22] pb-6 mb-8">
                  <div>
                    <h1 className="text-2xl font-black text-[#0e2d22] mb-1">Procedimento Operacional Padrão</h1>
                    <h2 className="text-lg font-bold text-slate-700">{popAberto.titulo}</h2>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-amber-500">{popAberto.codigo}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Revisão: Atual</div>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-6 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Módulo</p>
                    <p className="font-semibold text-slate-700">{popAberto.modulo}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsável</p>
                    <p className="font-semibold text-slate-700">{popAberto.responsavel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Periodicidade</p>
                    <p className="font-semibold text-slate-700">{popAberto.periodicidade}</p>
                  </div>
                </div>

                {/* Objetivo */}
                <div className="mb-8">
                  <h3 className="text-sm font-black text-[#0e2d22] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Target size={16} className="text-amber-500" /> Objetivo
                  </h3>
                  <p className="text-slate-600 leading-relaxed bg-white border-l-4 border-emerald-500 pl-4 py-1">
                    {popAberto.objetivo}
                  </p>
                </div>

                {/* Passos */}
                <div className="mb-8">
                  <h3 className="text-sm font-black text-[#0e2d22] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" /> Passo a Passo
                  </h3>
                  <div className="space-y-4">
                    {popAberto.passos.map((passo, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-slate-700 leading-relaxed">{passo}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alertas */}
                {popAberto.alertas.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-sm font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <AlertTriangle size={16} /> Alertas e Cuidados
                    </h3>
                    <div className="bg-amber-50 p-5 rounded-xl border border-amber-100 space-y-3">
                      {popAberto.alertas.map((alerta, idx) => (
                        <div key={idx} className="flex gap-3 text-amber-800">
                          <ChevronRight size={16} className="shrink-0 mt-0.5 opacity-50" />
                          <p className="leading-relaxed text-sm">{alerta}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Referências */}
                {popAberto.referencias.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Referências</h3>
                    <ul className="list-disc list-inside text-sm text-slate-500 space-y-1">
                      {popAberto.referencias.map((ref, idx) => (
                        <li key={idx}>{ref}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-16 pt-8 border-t border-slate-200 text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                  Documento gerado pelo sistema Éllus Gestão Estratégica
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
        </>
      ) : (
        isElegibleForRotina && <RotinaGerenciavelTab />
      )}

    </div>
  )
}
